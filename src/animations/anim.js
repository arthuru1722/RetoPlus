document.addEventListener('DOMContentLoaded', () => {
            
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const intactHeart = document.getElementById('intact-heart');
const crackedHeart = document.getElementById('cracked-heart');
const impactFrame = document.getElementById('impact-frame');
const bloodOverlay = document.getElementById('blood-overlay');
const finalMessage = document.querySelector('.final-message');
const crackSound = document.querySelector('.crack-sound');
startBtn.addEventListener('click', startAnimation);
resetBtn.addEventListener('click', resetAnimation);

setTimeout(resetAnimation, 1);

function startAnimation() {
    // Desativar o botão durante a animação
    startBtn.disabled = true;
    startBtn.classList.remove('pulse');
    
    // Criar timeline para sincronizar as animações
    const tl = gsap.timeline();
    
    // ANIMAÇÃO DE SURGIMENTO DO CORAÇÃO (NOVA)
    tl.to(intactHeart, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "power1.out",
        delay: 0.2
    });
    
    // Pausa antes do próximo efeito
    tl.to(intactHeart, {
        duration: 0.5
    });
    
    // Tremer o coração antes de rachar
    tl.to(intactHeart, {
        scale: 1.75,
        opacity: 0,
        duration: 0.5,
        stagger: {
            each: 0.5,
            repeat: 3
        }
    });
    
    // Frame de impacto (vermelho sólido)
    tl.to(impactFrame, {
        opacity: 1,
        duration: 0.01,
        ease: "power1.out"
    });
    
    // Reproduzir som de rachadura
    if (crackSound) {
        crackSound.currentTime = 0;
        crackSound.volume = 0.3;
        crackSound.play().catch(e => console.log("Som não pode ser reproduzido: ", e));
    }
    
    // Esconder o frame de impacto e mostrar coração rachado
    tl.to(impactFrame, {
        opacity: 0,
        duration: 0.2,
        ease: "power1.in"
    });
    
    tl.to(intactHeart, {
        opacity: 0,
        duration: 0.2
    }, "-=0.3");
    
    tl.to(crackedHeart, {
        opacity: 1,
        duration: 0.1,
        ease: "power2.out"
    }, "-=0.3");
    
    // Efeito de brilho vermelho
    tl.to(crackedHeart, {
        keyframes: [
            { color: '#ff0000', filter: 'drop-shadow(0 0 30px #ff0000)', duration: 0.1 },
            { color: '#c0392b', filter: 'drop-shadow(0 0 15px rgba(192, 57, 43, 0.9))', duration: 0.3 }
        ]
    });
    
    // Iniciar o efeito de sangue vazando
    tl.to(bloodOverlay, {
        opacity: 1,
        duration: 0.2
    });
    
    // Expandir o sangue até cobrir toda a tela
    tl.to(bloodOverlay, {
        background: "radial-gradient(circle, #e74c3c 100%, #e74c3c 100%)",
        duration: 2,
        ease: "expo.out"
    });
    
    // Mostrar mensagem final
    tl.to(finalMessage, {
        opacity: 1,
        scale: 1.2,
        duration: 1,
        ease: "elastic.out(1, 0.5)"
    }, "-=1");
    
    // Mostrar botão de reset
    tl.to(resetBtn, {
        display: "block",
        opacity: 1,
        duration: 0.5
    }, "-=0.5");
}

function resetAnimation() {
    const tl = gsap.timeline();
    
    // Esconder botão de reset
    tl.to(resetBtn, {
        display: "none",
        opacity: 0,
        duration: 0.3
    });
    
    // Remover sangue
    tl.to(bloodOverlay, {
        background: "radial-gradient(circle, #e74c3c 0%, transparent 0%)",
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    });
    
    // Remover mensagem final
    tl.to(finalMessage, {
        opacity: 0,
        scale: 0.5,
        duration: 0.5
    }, "<");
    
    // Esconder coração rachado
    tl.to(crackedHeart, {
        opacity: 0,
        duration: 0.3
    }, "<");
    
    // Restaurar coração íntegro para estado inicial (invisível)
    tl.set(intactHeart, {
        opacity: 0,
        scale: 0
    });
    
    // Reativar botão de início
    tl.to(startBtn, {
        onComplete: () => {
            startBtn.disabled = false;
            startBtn.classList.add('pulse');
        }
    });
}
});