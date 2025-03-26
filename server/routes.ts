import express, { type Express, type Request, type Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { storage } from "./storage";
import { insertVehicleSchema, insertLicenseSchema, insertActivitySchema, licenseStatuses } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: function (req, file, cb) {
    // Accept only PDFs and images
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use apenas PDF ou imagens.') as any);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // ===== Setup initial admin account =====
  app.post("/api/setup-admin", async (req, res) => {
    try {
      // Verificar se a senha de instalação está correta
      if (req.body.setupPassword !== "142536!@NVS") {
        return res.status(401).json({ message: "Senha de instalação inválida" });
      }

      // Verificar se já existe um admin
      const adminUsers = await storage.getAllAdminUsers();
      if (adminUsers.length > 0) {
        return res.status(400).json({ message: "Conta de administrador já configurada" });
      }

      // Criar o usuário admin
      const adminUser = await storage.createUser({
        email: req.body.email,
        password: req.body.password,
        fullName: "Administrador",
        phone: req.body.phone || "0000000000",
        isAdmin: true
      });

      // Retorna o administrador criado (sem a senha)
      const { password, ...adminWithoutPassword } = adminUser;
      res.status(201).json(adminWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao configurar administrador" });
    }
  });

  // ===== Admin Routes =====
  
  // Get all licenses for admin panel
  app.get("/api/admin/licenses", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const licenses = await storage.getAllLicenses(status);
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter licenças" });
    }
  });
  
  // Get available status options
  app.get("/api/admin/status-options", isAdmin, (req, res) => {
    res.json(licenseStatuses);
  });
  
  // Update license status (admin)
  app.put("/api/admin/licenses/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de licença inválido" });
      }
      
      const { status } = req.body;
      if (!status || !licenseStatuses.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      
      const license = await storage.getLicense(id);
      if (!license) {
        return res.status(404).json({ message: "Licença não encontrada" });
      }
      
      const updatedLicense = await storage.updateLicense(id, { status });
      
      // Registrar a atividade
      await storage.createActivity({
        description: `Status da licença ${license.licenseNumber || id} alterado para: ${status}`,
        licenseId: id,
        userId: req.user.id
      });
      
      res.json(updatedLicense);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status da licença" });
    }
  });
  
  // Upload license file (admin)
  app.put("/api/admin/licenses/:id/file", isAdmin, upload.single('licenseFile'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de licença inválido" });
      }
      
      // Verificar se licença existe
      const license = await storage.getLicense(id);
      if (!license) {
        return res.status(404).json({ message: "Licença não encontrada" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      const licenseFileUrl = `/uploads/${req.file.filename}`;
      const now = new Date();
      // Se estiver marcando como liberada, definir datas de emissão e expiração
      let updateData: any = { 
        licenseFileUrl,
        status: "Liberada" 
      };
      
      // Se estiver configurando o número da licença
      if (req.body.licenseNumber) {
        updateData.licenseNumber = req.body.licenseNumber;
      }
      
      // Configurar datas
      if (req.body.issueDate) {
        updateData.issueDate = new Date(req.body.issueDate);
      } else {
        updateData.issueDate = now;
      }
      
      if (req.body.expirationDate) {
        updateData.expirationDate = new Date(req.body.expirationDate);
      } else {
        // Expiração padrão de 1 ano
        const expirationDate = new Date(now);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        updateData.expirationDate = expirationDate;
      }
      
      const updatedLicense = await storage.updateLicense(id, updateData);
      
      // Registrar a atividade
      await storage.createActivity({
        description: `Licença ${license.licenseNumber || updatedLicense.licenseNumber || id} emitida e disponibilizada`,
        licenseId: id,
        userId: req.user.id
      });
      
      res.json(updatedLicense);
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer upload do arquivo da licença" });
    }
  });

  // ===== Dashboard Routes =====
  
  // Get user dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter estatísticas" });
    }
  });
  
  // Get recent activities
  app.get("/api/dashboard/activities", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const activities = await storage.getActivitiesByUserId(req.user.id, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter atividades recentes" });
    }
  });

  // ===== Vehicle Routes =====
  
  // Get all vehicles for current user
  app.get("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesByUserId(req.user.id);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter veículos" });
    }
  });
  
  // Get vehicles by type
  app.get("/api/vehicles/type/:type", isAuthenticated, async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesByType(req.params.type, req.user.id);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter veículos por tipo" });
    }
  });
  
  // Get a specific vehicle
  app.get("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de veículo inválido" });
      }
      
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      // Check if vehicle belongs to current user
      if (vehicle.userId !== req.user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter veículo" });
    }
  });
  
  // Create a new vehicle
  app.post("/api/vehicles", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      // Parse JSON data or form fields
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        weight: parseInt(req.body.weight),
        documentYear: parseInt(req.body.documentYear),
        userId: req.user.id
      });
      
      // Check if vehicle with same license plate already exists
      const existingVehicle = await storage.getVehicleByLicensePlate(vehicleData.licensePlate);
      if (existingVehicle) {
        return res.status(400).json({ message: "Veículo com esta placa já cadastrado" });
      }
      
      // If file was uploaded, set document URL
      if (req.file) {
        vehicleData.documentUrl = `/uploads/${req.file.filename}`;
      }
      
      const vehicle = await storage.createVehicle(vehicleData);
      
      // Create an activity record
      await storage.createActivity({
        description: `Novo veículo cadastrado - ${vehicleData.vehicleType} ${vehicleData.licensePlate}`,
        vehicleId: vehicle.id,
        userId: req.user.id
      });
      
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Erro ao criar veículo" });
    }
  });
  
  // Update a vehicle
  app.put("/api/vehicles/:id", isAuthenticated, upload.single('document'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de veículo inválido" });
      }
      
      // Check if vehicle exists and belongs to user
      const existingVehicle = await storage.getVehicle(id);
      if (!existingVehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      if (existingVehicle.userId !== req.user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Parse and validate data
      const updateData = {
        ...req.body,
        weight: req.body.weight ? parseInt(req.body.weight) : undefined,
        documentYear: req.body.documentYear ? parseInt(req.body.documentYear) : undefined
      };
      
      // If file was uploaded, set document URL
      if (req.file) {
        updateData.documentUrl = `/uploads/${req.file.filename}`;
      }
      
      const updatedVehicle = await storage.updateVehicle(id, updateData);
      
      res.json(updatedVehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Erro ao atualizar veículo" });
    }
  });
  
  // Delete a vehicle
  app.delete("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de veículo inválido" });
      }
      
      // Check if vehicle exists and belongs to user
      const existingVehicle = await storage.getVehicle(id);
      if (!existingVehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      if (existingVehicle.userId !== req.user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Check if vehicle is used in any licenses
      const userLicenses = await storage.getLicensesByUserId(req.user.id);
      const isVehicleInUse = userLicenses.some(license => 
        license.primaryVehicleId === id || 
        license.firstTrailerId === id || 
        license.dollyId === id || 
        license.secondTrailerId === id
      );
      
      if (isVehicleInUse) {
        return res.status(400).json({ message: "Veículo está em uso em uma ou mais licenças e não pode ser excluído" });
      }
      
      await storage.deleteVehicle(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir veículo" });
    }
  });
  
  // ===== License Routes =====
  
  // Get draft licenses
  app.get("/api/licenses/drafts", isAuthenticated, async (req, res) => {
    try {
      const licenses = await storage.getDraftLicensesByUserId(req.user.id);
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter licenças em rascunho" });
    }
  });
  
  // Get in-progress licenses
  app.get("/api/licenses/in-progress", isAuthenticated, async (req, res) => {
    try {
      const licenses = await storage.getInProgressLicensesByUserId(req.user.id);
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter licenças em andamento" });
    }
  });
  
  // Get completed licenses
  app.get("/api/licenses/completed", isAuthenticated, async (req, res) => {
    try {
      const licenses = await storage.getCompletedLicensesByUserId(req.user.id);
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter licenças emitidas" });
    }
  });
  
  // Get a specific license
  app.get("/api/licenses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de licença inválido" });
      }
      
      const license = await storage.getLicense(id);
      if (!license) {
        return res.status(404).json({ message: "Licença não encontrada" });
      }
      
      // Check if license belongs to current user
      if (license.userId !== req.user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(license);
    } catch (error) {
      res.status(500).json({ message: "Erro ao obter licença" });
    }
  });
  
  // Create a new license
  app.post("/api/licenses", isAuthenticated, async (req, res) => {
    try {
      // Parse JSON data
      const licenseData = insertLicenseSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const license = await storage.createLicense(licenseData);
      
      // If not a draft, create an activity record
      if (!licenseData.isDraft) {
        await storage.createActivity({
          description: `Nova licença solicitada - ${licenseData.setType}`,
          licenseId: license.id,
          userId: req.user.id
        });
      }
      
      res.status(201).json(license);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Erro ao criar licença" });
    }
  });
  
  // Update a license
  app.put("/api/licenses/:id", isAuthenticated, upload.single('licenseFile'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de licença inválido" });
      }
      
      // Check if license exists and belongs to user
      const existingLicense = await storage.getLicense(id);
      if (!existingLicense) {
        return res.status(404).json({ message: "Licença não encontrada" });
      }
      
      if (existingLicense.userId !== req.user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Parse and validate data
      const updateData = { ...req.body };
      
      // If file was uploaded, set license file URL
      if (req.file) {
        updateData.licenseFileUrl = `/uploads/${req.file.filename}`;
      }
      
      // If transitioning from draft to actual license, record activity
      if (existingLicense.isDraft && updateData.isDraft === "false") {
        updateData.isDraft = false;
        
        await storage.createActivity({
          description: `Licença ${existingLicense.setType} enviada para processamento`,
          licenseId: existingLicense.id,
          userId: req.user.id
        });
      }
      
      // If status is updated, record activity
      if (updateData.status && updateData.status !== existingLicense.status) {
        await storage.createActivity({
          description: `Licença ${existingLicense.licenseNumber || id} mudou de status para: ${updateData.status}`,
          licenseId: existingLicense.id,
          userId: req.user.id
        });
      }
      
      const updatedLicense = await storage.updateLicense(id, updateData);
      
      res.json(updatedLicense);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Erro ao atualizar licença" });
    }
  });
  
  // Delete a license
  app.delete("/api/licenses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de licença inválido" });
      }
      
      // Check if license exists and belongs to user
      const existingLicense = await storage.getLicense(id);
      if (!existingLicense) {
        return res.status(404).json({ message: "Licença não encontrada" });
      }
      
      if (existingLicense.userId !== req.user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Only draft licenses can be deleted
      if (!existingLicense.isDraft) {
        return res.status(400).json({ message: "Apenas licenças em rascunho podem ser excluídas" });
      }
      
      await storage.deleteLicense(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir licença" });
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
