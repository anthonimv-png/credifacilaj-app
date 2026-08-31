const nodemailer = require('nodemailer');
require('dotenv').config();

async function probarCorreo() {
    console.log('--- INICIANDO PRUEBA DE CORREO ---');
    console.log('Usuario:', process.env.EMAIL_USER);
    
    // Configuración
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true para 465, false para otros puertos
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        // Verificar conexión
        await transporter.verify();
        console.log('✅ Conexión con Gmail exitosa.');

        // Intentar enviar
        const info = await transporter.sendMail({
            from: `"Prueba Sistema" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Te lo envías a ti mismo
            subject: "Test de Sistema de Préstamos",
            text: "Si lees esto, la configuración es correcta."
        });

        console.log('✅ Correo enviado correctamente ID:', info.messageId);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.code === 'EAUTH') {
            console.log('--> PISTA: Tu contraseña o correo están mal. Recuerda usar la "Contraseña de Aplicación" de Google, no la normal.');
        }
    }
}

probarCorreo();