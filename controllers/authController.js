const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');

const authController = {
    
    // Mostrar formulario de Login
    mostrarLogin: (req, res) => {
        // Si ya está logueado, mandarlo al dashboard
        if (req.session.usuario) {
            return res.redirect('/');
        }
        res.render('login', { layout: false }); // layout: false porque el login no lleva sidebar
    },

    // Procesar Login
    login: async (req, res) => {
        const { email, password } = req.body;

        try {
            // 1. Buscar usuario
            const usuario = await UsuarioModel.buscarPorEmail(email);

            if (!usuario) {
                req.flash('mensajeError', 'Usuario o contraseña incorrectos');
                return res.redirect('/auth/login');
            }

            // 2. Verificar contraseña (comparar texto plano con encriptado)
            const passwordValido = await bcrypt.compare(password, usuario.password);

            if (!passwordValido) {
                req.flash('mensajeError', 'Usuario o contraseña incorrectos');
                return res.redirect('/auth/login');
            }

            // 3. Crear Sesión
            req.session.usuario = {
                id: usuario.id,
                nombre: usuario.nombre_completo,
                email: usuario.email,
                rol: usuario.rol
            };

            res.redirect('/');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error en el servidor');
            res.redirect('/auth/login');
        }
    },

    // Cerrar Sesión
    logout: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/auth/login');
        });
    }
};

module.exports = authController;