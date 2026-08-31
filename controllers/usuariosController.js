const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');

const usuariosController = {

    // Listar usuarios
    listar: async (req, res) => {
        try {
            const usuarios = await UsuarioModel.obtenerTodos();
            res.render('usuarios/index', { 
                title: 'Gestión de Personal',
                usuarios: usuarios 
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar usuarios');
            res.redirect('/');
        }
    },

    // Formulario de creación
    mostrarFormulario: (req, res) => {
        res.render('usuarios/crear', { title: 'Nuevo Usuario' });
    },

    // Guardar nuevo usuario
    guardar: async (req, res) => {
        const { nombre_completo, email, password, rol } = req.body;

        try {
            // Validar que no exista el email
            const existe = await UsuarioModel.buscarPorEmail(email);
            if (existe) {
                req.flash('mensajeError', 'El correo electrónico ya está registrado.');
                return res.redirect('/usuarios/crear');
            }

            // Encriptar contraseña
            const passwordHash = await bcrypt.hash(password, 10);

            await UsuarioModel.crear({
                nombre_completo,
                email,
                password: passwordHash,
                rol
            });

            req.flash('mensajeExito', 'Usuario creado correctamente.');
            res.redirect('/usuarios');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear usuario.');
            res.redirect('/usuarios/crear');
        }
    },

    // Eliminar usuario
    eliminar: async (req, res) => {
        const { id } = req.params;
        
        // Evitar que te borres a ti mismo
        if (req.session.usuario.id == id) {
            req.flash('mensajeError', 'No puedes eliminar tu propia cuenta mientras estás logueado.');
            return res.redirect('/usuarios');
        }

        try {
            await UsuarioModel.eliminar(id);
            req.flash('mensajeExito', 'Usuario eliminado.');
            res.redirect('/usuarios');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al eliminar.');
            res.redirect('/usuarios');
        }
    }
};

module.exports = usuariosController;