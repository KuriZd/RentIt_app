# 📱 RentIt — Aplicación Móvil de Renta de Artículos

**RentIt** es una aplicación móvil desarrollada como parte del curso **Aplicaciones Móviles (8º semestre)** en el **Instituto Tecnológico de Morelia**.  
Permite a los usuarios **publicar, rentar y calificar artículos** de forma sencilla y segura, ofreciendo un ecosistema colaborativo para el intercambio temporal de bienes.

---

## 🚀 Funcionalidades Principales

- 🏷️ **Publicación de artículos** con fotos, descripción, costo y periodo de disponibilidad.  
- 🔄 **Renta de artículos** publicados por otros usuarios, con validación del costo y aprobación del arrendador.  
- ⭐ **Sistema de reseñas y calificaciones** para artículos y arrendadores, generando reputación.  
- 👤 **Panel de usuario** con historial de publicaciones, rentas realizadas y métricas de uso.  
- 🔐 **Autenticación segura** con Supabase.  
- 🌙 **Interfaz responsiva y adaptable al tema oscuro/claro** gracias a NativeWind.

---

## 🧩 Tecnologías Utilizadas

| Módulo | Tecnología | Descripción |
|--------|-------------|--------------|
| **Frontend (App Móvil)** | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) | Framework para desarrollo móvil multiplataforma. |
| **Estilos** | [NativeWind](https://www.nativewind.dev/) | Integración de Tailwind CSS con React Native. |
| **Base de Datos / Backend** | [Supabase](https://supabase.io/) (PostgreSQL) | Almacenamiento, autenticación y API REST. |
| **Backend Complementario** | [Python Flask](https://flask.palletsprojects.com/) | Servicios web personalizados. |
| **Hosting / Infraestructura** | [Hostinger](https://www.hostinger.mx/) | Servidor para despliegue del backend y API. |

---

## 🧱 Arquitectura del Proyecto

```
RentIt/
│
├── app/                     # Código fuente principal (Expo)
│   ├── components/          # Componentes reutilizables (Cards, Modals, etc.)
│   ├── screens/             # Pantallas (Home, Login, Rent, Profile, etc.)
│   ├── navigation/          # Configuración de rutas (expo-router)
│   ├── services/            # Conexión a Supabase y Flask API
│   └── assets/              # Imágenes, íconos y recursos multimedia
│
├── backend/                 # Servicios Flask y configuración de endpoints
│
├── supabase/                # Configuración del proyecto Supabase
│
├── package.json             # Dependencias del proyecto
├── README.md                # Este archivo
└── app.json / tsconfig.json # Configuración de Expo y TypeScript
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/usuario/rentit.git
cd rentit
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyxxxx...
```

### 4. Ejecutar el proyecto
```bash
npx expo start
```

### 5. Ejecutar el backend (Flask)
```bash
cd backend
python app.py
```

---

## 📲 Estructura de Pantallas

- **Login / Registro**
- **Inicio (exploración de artículos)**
- **Publicar artículo**
- **Rentar artículo**
- **Detalles del artículo**
- **Panel de usuario**
- **Historial y reseñas**

---

## 🧑‍💻 Equipo de Desarrollo

| Nombre | Rol |
|--------|------|
| **Oscar Kuricaveri Zamudio Damian** | Líder de desarrollo / Frontend |
| **Alexis Gabriel García Contreras** | Backend / Integración Supabase |
| **Eladio Martínez Ambriz** | UX/UI Designer / QA Testing |
| **Profesor:** J. Guadalupe Ramos Díaz | Asesor académico |

---

## 🧾 Licencia

Este proyecto fue desarrollado con fines académicos y educativos.  
© 2025 **RentIt App Team** — Todos los derechos reservados.

---

## 🌟 Notas

- Proyecto académico correspondiente al **8º semestre, Asignatura: Aplicaciones Móviles**.  
- Enfocado en **UX fluida**, **seguridad** y **arquitectura modular**.  
- Compatible con **Android** y **iOS** mediante Expo.

---

> “La colaboración comienza cuando compartimos lo que tenemos. RentIt hace de eso una experiencia digital.” 💡
