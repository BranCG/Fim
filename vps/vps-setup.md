# Manual de Configuración del Servidor VPS (Ubuntu/Debian) 🚀

Este manual detalla los pasos y comandos exactos para configurar tu servidor VPS en **DigitalOcean** o **Hetzner** para ejecutar la API de **Fim** de manera segura con HTTPS en `api.fim.cl`.

---

## Prerrequisitos
1. Un servidor VPS con **Ubuntu 20.04 LTS** o **Ubuntu 22.04 LTS** instalado.
2. Acceso SSH como usuario root o con privilegios `sudo`.
3. Tu dominio (`api.fim.cl`) apuntando a la dirección IP pública del VPS en el panel de DNS de tu proveedor de dominios.

---

## Paso 1: Actualizar el Sistema y Configurar el Firewall (UFW)

Es fundamental asegurar el servidor abriendo solo los puertos necesarios para el funcionamiento de la aplicación.

```bash
# Actualizar repositorios e instalar actualizaciones del sistema
sudo apt update && sudo apt upgrade -y

# Instalar utilidades esenciales
sudo apt install -y curl git ufw

# Configurar el Firewall (Abrir SSH, HTTP y HTTPS)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar el Firewall (Presiona 'y' para confirmar cuando lo solicite)
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## Paso 2: Clonar el Proyecto y Preparar Directorios

Recomendamos colocar el proyecto en el directorio `/var/www/`.

```bash
# Crear directorio principal
sudo mkdir -p /var/www/fim-app
sudo chown -R $USER:$USER /var/www/fim-app

# Clonar tu repositorio Git de Fim dentro de la carpeta
git clone <URL_DE_TU_REPOSITORIO> /var/www/fim-app
```

Una vez clonado, crea tu archivo de entorno de producción en `/var/www/fim-app/apps/api/.env` con tus credenciales seguras:
```bash
nano /var/www/fim-app/apps/api/.env
```
*(Ingresa tus credenciales reales de Supabase, JWT_SECRET, JWT_REFRESH_SECRET y la URL de Upstash Redis)*

---

## Paso 3: Opción de Ejecución (Elige A o B)

### Opción A: Despliegue con Docker Compose (Recomendado 🏆)
Instala Docker y levanta el contenedor con un solo comando.

```bash
# Instalar Docker y Docker Compose
sudo apt install -y docker.io docker-compose

# Habilitar e iniciar Docker
sudo systemctl enable --now docker

# Levantar la API en segundo plano
cd /var/www/fim-app
sudo docker-compose up --build -d

# Ver los logs del contenedor para confirmar que inició bien
sudo docker-compose logs -f
```

### Opción B: Despliegue con Node.js Nativo y PM2
Si prefieres no usar Docker, puedes compilarlo y correrlo en Node directamente.

```bash
# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar dependencias del proyecto y compilar
cd /var/www/fim-app
npm install
npm run build

# Iniciar la API con PM2 usando la configuración creada
pm2 start ecosystem.config.js --env production

# Configurar PM2 para que se inicie automáticamente tras reiniciar el servidor VPS
pm2 startup
# (Copia y ejecuta el comando de salida que PM2 te imprima en pantalla)
pm2 save
```

---

## Paso 4: Instalar y Configurar Nginx

Nginx actuará como el proxy inverso recibiendo el tráfico externo del puerto 80/443 y enviándolo internamente al puerto 3001 de la API.

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear un enlace simbólico de nuestra configuración a sites-enabled
sudo ln -sf /var/www/fim-app/vps/fim-api.conf /etc/nginx/sites-enabled/fim-api

# Desactivar la configuración por defecto de Nginx para evitar conflictos
sudo rm -f /etc/nginx/sites-enabled/default

# Probar que la sintaxis de Nginx sea correcta
sudo nginx -t
# (Debe responder: syntax is ok, test is successful)

# Recargar Nginx para aplicar la configuración
sudo systemctl reload nginx
```

---

## Paso 5: Obtener Certificado SSL Gratuito con Let's Encrypt (Certbot)

Certbot generará el certificado de seguridad automáticamente e inyectará la clave SSL en Nginx.

```bash
# Instalar Certbot y el plugin de Nginx
sudo apt install -y certbot python3-certbot-nginx

# Generar el certificado para api.fim.cl (Reemplaza con tu correo para notificaciones de renovación)
sudo certbot --nginx -d api.fim.cl --agree-tos --m tu-correo@ejemplo.com --no-eff-email

# Certbot modificará la configuración de Nginx para validar el SSL.
# Probamos de nuevo que todo esté correcto:
sudo nginx -t
sudo systemctl reload nginx
```

---

## Paso 6: Configurar Renovación Automática del SSL

Los certificados de Let's Encrypt duran 90 días, pero Certbot incluye una tarea programada para renovarlos de manera totalmente automática de por vida.

```bash
# Probar que el simulador de renovación funcione
sudo certbot renew --dry-run
# (Si no da errores, la auto-renovación ya está activa y configurada)
```

¡Felicidades! Tu API de Fim ya está corriendo en producción, protegida bajo HTTPS y con soporte WebSocket en `https://api.fim.cl`.
