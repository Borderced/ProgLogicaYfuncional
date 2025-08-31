# Sistema de Gestión de Documentos Personales

Una aplicación web moderna para la gestión de documentos personales con autenticación de usuarios y roles diferenciados.

## Características

- **Autenticación**: Registro e inicio de sesión con Firebase Auth
- **Roles de Usuario**: Usuario estándar y Administrador
- **Subida de Archivos**: Soporte para PDFs e imágenes usando Uppy
- **Gestión de Documentos**: Visualización, descarga y eliminación de documentos
- **Panel Administrativo**: Vista completa de todos los usuarios y sus documentos

## Tecnologías Utilizadas

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de Datos**: Firebase Firestore
- **Almacenamiento**: Firebase Storage
- **Autenticación**: Firebase Auth
- **Subida de Archivos**: Uppy

## Estructura del Proyecto

```
paginaBecerro/
├── backend/              # Servidor Node.js
│   ├── config/          # Configuración de Firebase
│   ├── middleware/      # Middleware de autenticación
│   ├── routes/          # Rutas de la API
│   └── server.js        # Servidor principal
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── contexts/    # Contextos (AuthContext)
│   │   └── config/      # Configuración de Firebase
├── firestore.rules      # Reglas de seguridad de Firestore
├── storage.rules        # Reglas de seguridad de Storage
└── .env                 # Variables de entorno
```

## Instalación y Configuración

### 1. Configurar Apikeys
 Descarga el archivo frontend.rar que envie al grupo de whatsapp (extraelo, te saldra un archivo .env) y pegalo dentro de la carpeta ``` frontend ``` en el proyecto
 Descarga el archivo backend.rar que tambien envie al grupo de whatsapp (extraelo) y pega el contenido dentro de la carpeta ``` backend ``` en el proyecto


### 2. Instalar Dependencias

Para instalar las dependencias (debes tener nodejs instalado):

```bash
# En una terminal en la carpeta Backend
cd backend
npm install

# En una terminal en la carpeta Frontend
cd ../frontend
npm install --legacy-peer-deps
```

### 3. Ejecutar la Aplicación

#### Opción 1: Manual (Recomendado)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (en otra terminal)
cd frontend
npm start
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Uso de la Aplicación

### Para Usuarios Estándar

1. **Registro**: Crea una cuenta con nombre, apellido, email y contraseña
2. **Login**: Inicia sesión con tu email y contraseña
3. **Subir Documentos**: 
   - Haz clic en "Subir Documento"
   - Selecciona el tipo de documento
   - Arrastra archivos o haz clic para seleccionar
   - Añade una descripción opcional
4. **Gestionar Documentos**: Ver, descargar o eliminar tus documentos

### Para Administradores

1. **Panel Admin**: Accede al panel de administración para ver todos los documentos
2. **Gestión**: Ver documentos de todos los usuarios organizados por usuario

## Tipos de Documentos Soportados

- Acta de Nacimiento
- CURP
- INE/IFE
- Comprobante de Domicilio
- RFC
- Número de Seguridad Social
- Pasaporte
- Cédula Profesional
- Otros

## Formatos de Archivo Soportados

- **PDFs**: application/pdf
- **Imágenes**: jpg, jpeg, png, gif
- **Tamaño máximo**: 10MB por archivo

## Seguridad

- Autenticación basada en tokens JWT de Firebase
- Reglas de seguridad en Firestore y Storage
- Validación de tipos de archivo
- Protección CORS y rate limiting
- Separación de roles (usuario/admin)

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Obtener perfil
- `POST /api/auth/verify-token` - Verificar token

### Documentos
- `POST /api/documents/upload` - Subir documento
- `GET /api/documents/my-documents` - Obtener mis documentos
- `GET /api/documents/all` - Obtener todos (admin)
- `DELETE /api/documents/:id` - Eliminar documento

### Usuarios (Admin)
- `GET /api/users` - Obtener todos los usuarios
- `PUT /api/users/:id/role` - Actualizar rol de usuario

## Troubleshooting

### Error de CORS
Verifica que la variable `CORS_ORIGIN` en `.env` coincida con la URL del frontend.

### Error de Firebase
Verifica que todas las variables de entorno de Firebase estén correctamente configuradas usando:
```bash
cd backend
node scripts/test-config.js
```

### Error de Uppy/Tailwind
- Las dependencias de Uppy requieren `--legacy-peer-deps`
- Se usa Tailwind CSS desde CDN para evitar problemas de configuración
- Si hay errores de compilación, reinicia ambos servidores

### Puerto en uso
Si el puerto 3000 está ocupado:
```bash
# Encontrar proceso
netstat -ano | findstr :3000
# Terminar proceso (reemplazar PID por el puerto)
taskkill /F /PID [PID]
```

Credenciales por defecto: admin@docmanager.com / admin123456

## Desarrollo

Para añadir nuevas funcionalidades:

1. **Backend**: Añadir rutas en `/backend/routes/`
2. **Frontend**: Crear componentes en `/frontend/src/components/`
3. **Estilos**: Usar clases de Tailwind CSS
4. **Estado**: Usar hooks de React y contextos cuando sea necesario
