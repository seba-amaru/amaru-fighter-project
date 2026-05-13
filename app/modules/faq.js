/**
 * FAQ / Help section module
 */

export const FAQ = {
    items: [
        {
            question: '¿Cómo reservo una clase?',
            answer: 'Ve a la sección Agenda, selecciona el día que deseas, elige la clase disponible y presiona "Reservar". Recuerda que necesitas una membresía activa para hacer reservas.'
        },
        {
            question: '¿Cuántas clases puedo reservar por semana?',
            answer: 'Depende de tu plan de membresía. El plan básico permite 2 clases semanales, el plan intermedio 4 clases, y el plan avanzado clases ilimitadas. Puedes ver tu límite actual en tu perfil.'
        },
        {
            question: '¿Qué pasa si no puedo asistir a una clase reservada?',
            answer: 'Puedes cancelar tu reserva desde la sección "Mis Reservas" con al menos 2 horas de anticipación. Si no cancelas y no asistes, se contará como una ausencia.'
        },
        {
            question: '¿Cómo renuevo mi membresía?',
            answer: 'Dirígete a tu perfil y selecciona "Renovar Membresía". Allí podrás elegir entre los planes disponibles y realizar el pago de forma segura.'
        },
        {
            question: '¿Qué disciplinas ofrece Amaru Fighters?',
            answer: 'Ofrecemos MMA, Grappling/BJJ y Striking (Boxeo/Kickboxing). Cada disciplina tiene horarios específicos que puedes consultar en la agenda.'
        },
        {
            question: '¿Cómo subo mi foto de perfil?',
            answer: 'En tu perfil, toca sobre tu foto actual o el ícono de cámara. Podrás subir una nueva imagen desde tu dispositivo.'
        },
        {
            question: '¿Puedo cambiar mi estilo de combate?',
            answer: 'Sí, en tu perfil encontrarás un selector de "Estilo de Combate". Puedes cambiarlo en cualquier momento según tu preferencia.'
        },
        {
            question: '¿Cómo contacto al administrador?',
            answer: 'Desde la sección de mensajes en tu perfil, puedes enviar un mensaje directo al equipo de Amaru Fighters. Responderemos a la brevedad.'
        }
    ],

    init() {
        this.render();
        this.bindEvents();
    },

    render() {
        const container = document.getElementById('faq-container');
        if (!container) return;

        container.innerHTML = this.items.map((item, index) => `
            <div class="faq-item" data-index="${index}">
                <div class="faq-question">
                    <span>${item.question}</span>
                    <i data-lucide="chevron-down"></i>
                </div>
                <div class="faq-answer">${item.answer}</div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    },

    bindEvents() {
        document.querySelectorAll('.faq-item').forEach(item => {
            item.querySelector('.faq-question').addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
                if (!isOpen) item.classList.add('open');
            });
        });
    }
};
