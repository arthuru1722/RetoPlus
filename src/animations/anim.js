import * as main from '../main'

const intactHeart = document.getElementById('intact-heart');
const crackedHeart = document.getElementById('cracked-heart');
const impactFrame = document.getElementById('impact-frame');
const bloodOverlay = document.getElementById('blood-overlay');
const finalMessage = document.querySelector('.final-message');
const crackSound = document.querySelector('.crack-sound');


resetAnimation();

function startAnimation() {
    
    // Criar timeline para sincronizar as animações
    const tl = gsap.timeline();
    
    // ANIMAÇÃO DE SURGIMENTO DO CORAÇÃO
    tl.to(intactHeart, {
        opacity: 1,
        duration: 0.5,
        ease: "power1.in",
    });
    
    // Pausa antes do próximo efeito
    tl.to(intactHeart, {
        duration: 0.4
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
        ease: "elastic.out(1, 0.5)",
        onComplete: () => {
            document.getElementById("final-message").classList.remove("pointer-events-none");
            document.getElementById("final-message").classList.add("pointer-events-auto");
        }
    }, "-=1");  
}

window.startAnimation = startAnimation

function resetAnimation() {
    main.gameState.transitionAnim1 = true;
    const tl = gsap.timeline();
    
    
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
        duration: 0.1
    }, "<");
    
    // Esconder coração rachado
    tl.to(crackedHeart, {
        opacity: 0,
        duration: 0.3
    }, "<");
    
    // Restaurar coração íntegro para estado inicial (invisível)
    tl.set(intactHeart, {
        opacity: 0,
        scale: 1,
        onComplete: () => {
            document.getElementById("final-message").classList.remove("pointer-events-auto");
            document.getElementById("final-message").classList.add("pointer-events-none");
        }
    });

}
window.resetAnimation = resetAnimation;

//transição
const transicao = document.getElementById('transicao');
const barra = document.getElementById('barra');
const linhas = document.querySelectorAll('.linha');

function rodarTransicao() {
    main.gameState.dieAnim1 = true;
    transicao.style.pointerEvents = "auto";

    gsap.set(barra, { width: 0, height: 8, top: '50%', left: '50%', clearProps: 'all' });
    linhas.forEach(linha => gsap.set(linha, { height: 0, opacity: 1 }));

    const tl = gsap.timeline();

    tl.to(barra, {
        width: "80vw",
        duration: 0.5,
        ease: "power2.out"
    })
    .to(barra, {
        width: "100vw",
        height: "100vh",
        duration: 0.5,
        ease: "power1.inOut"
    }, "-=0.2")
    
    .to(linhas[0], {
        height: "100vh",
        duration: 0.3,
        ease: "power1.inOut"
    })
    .to(linhas[1], {
        height: "100vh",
        duration: 0.3,
        ease: "power1.inOut"
    })
    .to(linhas[2], {
        height: "100vh",
        duration: 0.3,
        ease: "power1.inOut",
        onComplete: () => {
            main.changeScreen(1);
        }
    })
    // Aqui começa a "abertura" da saída
    .to([barra, ...linhas], {
        height: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
            transicao.style.pointerEvents = "none";
            gsap.set([barra, ...linhas], {height: 0, opacity: 1});
            gsap.set(transicao, {opacity: 1});
        }
    });
    
    return tl;
}
window.rodarTransicao = rodarTransicao

//tempo esgotado

const audio = document.getElementById("alarme");
const fundo = document.getElementById("fundo");
const relogio = document.getElementById("relogio");
const relogioWrapper = document.getElementById("relogioWrapper");
const TE_content = document.getElementById("TE_content");

function tempoEsgotado() {
    // Primeiro, mostra o relógio manualmente
    TE_content.style.opacity = "0";
    relogioWrapper.style.display = "block";


    // Agora sim reseta a parada sem apagar o display
    gsap.set(relogioWrapper, {
        scale: 1,
        opacity: 1
    });

    gsap.set(relogio, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        textShadow: "0 0 0px rgba(255,255,255,0)"
    });

    gsap.set(fundo, {
        background: "transparent"
    });

    // timeline fudida
    const tl = gsap.timeline();

    tl.from(relogioWrapper, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: "back.out(2)"
    })

    .to(fundo, {
        background: "radial-gradient(circle, #333232, #000, #000)",
        duration: 1
    }, "<")

    .to(relogio, {
        textShadow: "0 0 50px rgba(220,220,220,0.7)",
        duration: 0.4
    }, "<")

    .add(() => {
        audio.currentTime = 0; // reset se quiser repetir depois
        audio.play();
    }, "+=0.1")

    .to(relogio, {
        keyframes: [
            { rotation: 20 },
            { rotation: 0 },
            { rotation: -20 },
            { rotation: 0 },

        ],
        repeat: 1,
        duration: 1,
        ease: "none",
    })

    
    .to(relogio, {
        opacity: 0,
        duration: 1.4,
        onComplete: () => {
            TE_content.style.display = "flex"
        }
    }, "-=1.4")

    .to(TE_content, {
        opacity: 1,
    });
}


function resetTempoEsgotado(action) {
    main.gameState.dieAnim2 = true;
    const tl = gsap.timeline();

    tl.to(TE_content, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            if (action === 0) {
                main.changeScreen(0);
            }else if (action === 1) {
                main.changeScreen(1);
            }
        }
    }, "<")

    .to(relogio, {
        opacity: 1,
        duration: 0.4,
    })

    .to(relogio, {
        textShadow: "0 0 0px rgba(255,255,255,0)",
        duration: 1.4
    }, "-=0.7")   

    .to(relogio, {
        scale: 0.5,  
        duration: 1,
        ease: "power4.inOut",
    }, "-=1")

    .to(relogio, {
        scale: 300.75,  
        duration: 0.5,
        ease: "none",
    }, "-=0.1")

    .to(fundo, {
        background: "transparent",
        duration: 0.5,
        onComplete: () => {
            TE_content.style.display = "none"
        }
    }, "-=0.5")

    .to(relogioWrapper, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
            relogioWrapper.style.display = "none";
        }
    });
}
window.resetTempoEsgotado = resetTempoEsgotado


export { startAnimation, resetAnimation, tempoEsgotado }