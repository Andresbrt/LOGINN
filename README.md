# CompraPro - Instrucciones de Despliegue

## ESTRUCTURA DEL PROYECTO

```
logionn/
├── comprapro-backend/          ← Spring Boot (Java 21)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/comprapro/
│       │   ├── ComproProApplication.java
│       │   ├── entity/         (Usuario, Cliente, Producto, EncabezadoCompra, DetalleCompra)
│       │   ├── repository/     (5 repositorios JPA)
│       │   ├── service/        (CompraService)
│       │   ├── controller/     (Auth, Cliente, Producto, Compra, Dashboard)
│       │   ├── dto/            (LoginRequest/Response, CompraRequest/Response, DashboardStats)
│       │   ├── security/       (JwtUtils, JwtAuthFilter)
│       │   └── config/         (SecurityConfig)
│       └── resources/
│           └── application.yml
└── comprapro-frontend/         ← React Native + Expo
    ├── App.tsx
    ├── package.json
    ├── app.json
    └── src/
        ├── config.ts           ← ⬅ CAMBIA LA IP AQUÍ
        ├── context/            (AuthContext)
        ├── navigation/         (AppNavigator)
        ├── screens/            (Login, Home, Clientes, Productos, Compra, MisCompras)
        ├── services/           (api.ts - Axios)
        └── theme/              (colors.ts)
```

---

## PASO 1: LEVANTAR EL BACKEND

### Requisitos
- Java 21 instalado
- Maven 3.9+ (o usar el wrapper)
- IntelliJ IDEA 2024+ (recomendado) o Eclipse + Spring Tools

### Opción A: IntelliJ IDEA
1. Abre IntelliJ IDEA
2. File → Open → Selecciona la carpeta `comprapro-backend`
3. Maven descargará dependencias automáticamente
4. Ejecuta `ComproProApplication.java` → Click derecho → Run

### Opción B: Línea de comandos
```bash
cd comprapro-backend
mvn spring-boot:run
```

### Verificar que el backend funciona
- URL: http://localhost:8080
- Consola H2: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:compraprodb`
  - User: `sa` | Password: (vacío)

### Test rápido de login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```
Respuesta esperada: JSON con `token`, `username`, `nombre`, `rol`

### DATOS PRECARGADOS AUTOMÁTICAMENTE:
- **Usuarios:** admin/123456 (ADMIN), vendedor/123456 (VENDEDOR)
- **5 Clientes** de demo
- **10 Productos** con stock variado

---

## PASO 2: CONFIGURAR LA IP EN EL FRONTEND

⚠️ **CRÍTICO:** El backend y el dispositivo móvil deben estar en la misma red WiFi.

1. En tu PC, abre una terminal y ejecuta:
   - **Windows:** `ipconfig` → busca "Dirección IPv4" (ej: 192.168.1.15)
   - **Mac/Linux:** `ifconfig` o `ip addr`

2. Edita el archivo: `comprapro-frontend/src/config.ts`
   ```typescript
   export const API_BASE_URL = 'http://TU_IP_AQUI:8080';
   // Ejemplo: 'http://192.168.1.15:8080'
   ```

3. Si usas emulador Android: usa `http://10.0.2.2:8080`
4. Si usas simulador iOS: usa `http://localhost:8080`

---

## PASO 3: LEVANTAR EL FRONTEND

### Requisitos
- Node.js 18+ (https://nodejs.org)
- Expo Go instalado en tu teléfono (Android o iOS)

### Instalar dependencias
```bash
cd comprapro-frontend
npm install
```

### Iniciar Expo
```bash
npx expo start
```

### Conectar el teléfono
1. Abre la app **Expo Go** en tu teléfono
2. Escanea el código QR que aparece en la terminal
3. La app cargará automáticamente

---

## PASO 4: USAR MySQL (OPCIONAL)

Por defecto, la app usa **H2 en memoria** (datos se pierden al reiniciar).

Para usar MySQL:
1. Instala MySQL 8.0+
2. En `application.yml`, comenta la sección H2 y descomenta MySQL:
   ```yaml
   datasource:
     url: jdbc:mysql://localhost:3306/compraprodb?createDatabaseIfNotExist=true&...
     username: root
     password: TU_PASSWORD_MYSQL
   jpa:
     hibernate:
       ddl-auto: update
     properties:
       hibernate:
         dialect: org.hibernate.dialect.MySQL8Dialect
   ```
3. La base de datos `compraprodb` se crea automáticamente con todas las tablas

---

## CREDENCIALES DE PRUEBA

| Usuario   | Contraseña | Rol      |
|-----------|-----------|----------|
| admin     | 123456    | ADMIN    |
| vendedor  | 123456    | VENDEDOR |

---

## ENDPOINTS DISPONIBLES

| Método | URL                          | Descripción              |
|--------|------------------------------|--------------------------|
| POST   | /api/auth/login              | Login                    |
| GET    | /api/auth/validate           | Validar token            |
| GET    | /api/dashboard/stats         | Estadísticas dashboard   |
| GET    | /api/clientes                | Listar clientes          |
| POST   | /api/clientes                | Crear cliente            |
| PUT    | /api/clientes/{id}           | Actualizar cliente       |
| DELETE | /api/clientes/{id}           | Eliminar cliente         |
| GET    | /api/clientes/buscar?q=      | Buscar clientes          |
| GET    | /api/productos               | Listar productos         |
| POST   | /api/productos               | Crear producto           |
| PUT    | /api/productos/{id}          | Actualizar producto      |
| DELETE | /api/productos/{id}          | Eliminar producto        |
| GET    | /api/productos/buscar?q=     | Buscar productos         |
| GET    | /api/productos/stock-bajo    | Productos con stock bajo |
| POST   | /api/compras                 | Realizar compra          |
| GET    | /api/compras                 | Listar compras           |
| GET    | /api/compras/{id}            | Detalle de compra        |

---

## FLUJO DE COMPRA (CÓMO USAR LA APP)

1. **Login** → ingresar con admin/123456
2. **Home** → ver estadísticas del día
3. **Tab "Comprar"** (botón central) →
   - Seleccionar cliente (buscador)
   - Agregar productos al carrito (buscador + cantidad)
   - Ver resumen en tiempo real (subtotal, IVA 12%, total)
   - Presionar "Confirmar Compra"
   - ✅ El backend guarda EncabezadoCompra + DetalleCompra y descuenta stock
4. **Tab "Historial"** → ver todas las compras con detalle

---

## SOLUCIÓN DE PROBLEMAS

### "Network Error" o "Connection refused"
- Verifica que el backend esté corriendo en el puerto 8080
- Verifica que la IP en `config.ts` sea correcta
- Asegúrate de que el PC y el teléfono estén en la misma WiFi
- Desactiva temporalmente el firewall de Windows

### Error al compilar el backend
- Verifica que tengas Java 21: `java -version`
- Limpia el proyecto: `mvn clean compile`

### Expo no escanea el QR
- Usa el mismo WiFi en PC y teléfono
- Cierra y vuelve a abrir Expo Go
- Ejecuta `npx expo start --tunnel` como alternativa

---

## TECNOLOGÍAS UTILIZADAS

**Backend:**
- Spring Boot 3.3 + Java 21
- Spring Security + JWT (jjwt 0.12.3)
- Spring Data JPA + Hibernate
- H2 Database (embebida) / MySQL
- Maven

**Frontend:**
- React Native 0.74 + Expo SDK 51
- React Navigation 6 (Stack + Bottom Tabs)
- Axios para REST API
- AsyncStorage para persistencia de sesión
- Expo Linear Gradient, Vector Icons
- TypeScript
