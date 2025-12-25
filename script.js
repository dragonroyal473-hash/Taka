// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi semua komponen
    initParticles();
    initAnimations();
    initGame();
    initSkills();
    initContact();
    initNavigation();
    
    // GSAP Animations
    gsap.registerPlugin(ScrollTrigger);
    setupScrollAnimations();
});

// 1️⃣ PARTICLE SYSTEM
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, ${Math.random() * 0.5 + 0.1})`;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            else if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            else if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create particles
    const particles = [];
    const particleCount = window.innerWidth < 768 ? 50 : 100;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connecting lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(100, 100, 255, ${0.2 * (1 - distance / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
}

// 2️⃣ GSAP ANIMATIONS
function initAnimations() {
    // Hero section animations
    const heroTl = gsap.timeline();
    
    heroTl
        .fromTo('.title-word', 
            { opacity: 0, y: 30, rotationX: -90 },
            { opacity: 1, y: 0, rotationX: 0, duration: 1, stagger: 0.3, ease: 'back.out(1.7)' }
        )
        .fromTo('.subtitle',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
            '-=0.5'
        )
        .fromTo('.scroll-down',
            { opacity: 0 },
            { opacity: 1, duration: 1, ease: 'power2.out' },
            '-=0.3'
        );
    
    // Typewriter effect for explanation
    const typewriterTl = gsap.timeline({
        scrollTrigger: {
            trigger: '#explanation',
            start: 'top 80%',
        }
    });
    
    typewriterTl
        .fromTo('.typewriter-text p',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.3, ease: 'power2.out' }
        )
        .fromTo('.interactive-buttons',
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
            '-=0.2'
        );
    
    // Interactive buttons in explanation
    document.getElementById('agree-btn').addEventListener('click', function() {
        gsap.to(this, {
            scale: 0.9,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                createFloatingEmoji('👍', this);
            }
        });
    });
    
    document.getElementById('challenge-btn').addEventListener('click', function() {
        gsap.to(this, {
            rotation: 360,
            duration: 0.5,
            onComplete: () => {
                createFloatingEmoji('🎯', this);
            }
        });
    });
}

// 3️⃣ GAME IMPLEMENTATION
function initGame() {
    const game = {
        score: 0,
        time: 60,
        timer: null,
        currentQuestion: null,
        difficulty: 'easy',
        isPlaying: false
    };
    
    const difficulties = {
        easy: { operations: ['+', '-'], maxNumber: 20, length: 3 },
        medium: { operations: ['+', '-', '×'], maxNumber: 50, length: 5 },
        hard: { operations: ['+', '-', '×', '÷'], maxNumber: 100, length: 8 }
    };
    
    // DOM Elements
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    const questionElement = document.getElementById('question');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const nextButton = document.getElementById('next-question');
    const startButton = document.getElementById('start-game');
    const resetButton = document.getElementById('reset-game');
    const feedbackElement = document.getElementById('feedback-text');
    const emojiElement = document.getElementById('emoji-display');
    const diffButtons = document.querySelectorAll('.diff-btn');
    
    // Generate random math question
    function generateQuestion() {
        const config = difficulties[game.difficulty];
        let expression = '';
        let correctAnswer;
        
        // Generate simple expression for easy
        if (game.difficulty === 'easy') {
            const num1 = Math.floor(Math.random() * config.maxNumber) + 1;
            const num2 = Math.floor(Math.random() * config.maxNumber) + 1;
            const operation = config.operations[Math.floor(Math.random() * config.operations.length)];
            
            expression = `${num1} ${operation} ${num2}`;
            correctAnswer = operation === '+' ? num1 + num2 : num1 - num2;
        } 
        // Generate longer expressions for medium/hard
        else {
            const length = config.length;
            let numbers = [];
            let operations = [];
            
            // Generate numbers and operations
            for (let i = 0; i < length; i++) {
                numbers.push(Math.floor(Math.random() * config.maxNumber) + 1);
                if (i < length - 1) {
                    operations.push(config.operations[Math.floor(Math.random() * config.operations.length)]);
                }
            }
            
            // Build expression
            expression = numbers[0];
            for (let i = 0; i < operations.length; i++) {
                expression += ` ${operations[i]} ${numbers[i + 1]}`;
            }
            
            // Calculate answer
            correctAnswer = numbers[0];
            for (let i = 0; i < operations.length; i++) {
                const operation = operations[i];
                const nextNum = numbers[i + 1];
                
                switch(operation) {
                    case '+': correctAnswer += nextNum; break;
                    case '-': correctAnswer -= nextNum; break;
                    case '×': correctAnswer *= nextNum; break;
                    case '÷': correctAnswer = Math.round((correctAnswer / nextNum) * 100) / 100; break;
                }
            }
        }
        
        game.currentQuestion = { expression, correctAnswer };
        questionElement.textContent = `${expression} = ?`;
        answerInput.value = '';
        answerInput.focus();
        
        // Animation for new question
        gsap.fromTo(questionElement,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
    }
    
    // Check answer
    function checkAnswer() {
        if (!game.isPlaying || !game.currentQuestion) return;
        
        const userAnswer = parseFloat(answerInput.value);
        const correctAnswer = game.currentQuestion.correctAnswer;
        const tolerance = 0.01; // For floating point comparison
        
        if (Math.abs(userAnswer - correctAnswer) < tolerance) {
            // Correct answer
            game.score += game.difficulty === 'easy' ? 10 : 
                         game.difficulty === 'medium' ? 20 : 30;
            
            scoreElement.textContent = game.score;
            feedbackElement.textContent = 'Benar! 🎉';
            feedbackElement.style.color = '#10b981';
            emojiElement.textContent = ['😄', '🥳', '🎊', '✨', '🏆'][Math.floor(Math.random() * 5)];
            
            // Confetti effect
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            
            // Green glow animation
            gsap.to(questionElement, {
                textShadow: '0 0 20px #10b981',
                duration: 0.5,
                yoyo: true,
                repeat: 1
            });
            
            // Score animation
            gsap.fromTo(scoreElement,
                { scale: 1.5 },
                { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        } else {
            // Wrong answer
            feedbackElement.textContent = `Salah! Jawaban: ${correctAnswer}`;
            feedbackElement.style.color = '#ef4444';
            emojiElement.textContent = ['😢', '😭', '😓', '😔', '🤕'][Math.floor(Math.random() * 5)];
            
            // Shake animation
            gsap.to('.game-container', {
                x: [0, -10, 10, -10, 10, 0],
                duration: 0.5,
                ease: 'power1.inOut'
            });
            
            // Red flash
            gsap.to(questionElement, {
                color: '#ef4444',
                duration: 0.3,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    gsap.to(questionElement, { color: '#6366f1', duration: 0.3 });
                }
            });
        }
        
        // Feedback animation
        gsap.fromTo(feedbackElement,
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5 }
        );
        
        gsap.fromTo(emojiElement,
            { scale: 0, rotation: -180 },
            { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.7)' }
        );
    }
    
    // Game timer
    function startTimer() {
        game.time = 60;
        timerElement.textContent = game.time;
        
        game.timer = setInterval(() => {
            game.time--;
            timerElement.textContent = game.time;
            
            // Timer warning
            if (game.time <= 10) {
                gsap.to(timerElement, {
                    color: '#ef4444',
                    scale: 1.2,
                    duration: 0.5,
                    yoyo: true,
                    repeat: 1
                });
            }
            
            if (game.time <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    function endGame() {
        clearInterval(game.timer);
        game.isPlaying = false;
        
        feedbackElement.textContent = `Game Over! Skor akhir: ${game.score}`;
        emojiElement.textContent = '🏁';
        
        // Disable input
        answerInput.disabled = true;
        submitButton.disabled = true;
        
        // Final score animation
        gsap.fromTo('.score-board',
            { scale: 1.1 },
            { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
        );
    }
    
    // Event Listeners
    diffButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            diffButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update difficulty
            game.difficulty = this.dataset.level;
            
            // Generate new question if game is running
            if (game.isPlaying) {
                generateQuestion();
            }
        });
    });
    
    submitButton.addEventListener('click', checkAnswer);
    
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    nextButton.addEventListener('click', generateQuestion);
    
    startButton.addEventListener('click', function() {
        if (!game.isPlaying) {
            game.isPlaying = true;
            game.score = 0;
            scoreElement.textContent = '0';
            
            answerInput.disabled = false;
            submitButton.disabled = false;
            
            generateQuestion();
            startTimer();
            
            // Button animation
            gsap.to(this, {
                scale: 0.9,
                duration: 0.1,
                yoyo: true,
                repeat: 1
            });
        }
    });
    
    resetButton.addEventListener('click', function() {
        clearInterval(game.timer);
        game.score = 0;
        game.time = 60;
        game.isPlaying = false;
        
        scoreElement.textContent = '0';
        timerElement.textContent = '60';
        feedbackElement.textContent = '';
        emojiElement.textContent = '😊';
        questionElement.textContent = '5 + 3 = ?';
        answerInput.value = '';
        answerInput.disabled = false;
        submitButton.disabled = false;
        
        // Reset difficulty to easy
        diffButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.diff-btn[data-level="easy"]').classList.add('active');
        game.difficulty = 'easy';
        
        // Animation
        gsap.to('.game-container', {
            rotation: 360,
            duration: 1,
            ease: 'back.out(1.7)'
        });
    });
    
    // Initialize first question
    generateQuestion();
}

// 4️⃣ SKILLS SECTION
function initSkills() {
    const skills = [
        { name: 'HTML5', icon: '🌐', level: 95, color: '#E34F26' },
        { name: 'CSS3', icon: '🎨', level: 90, color: '#1572B6' },
        { name: 'JavaScript', icon: '⚡', level: 85, color: '#F7DF1E' },
        { name: 'GSAP', icon: '🎬', level: 80, color: '#88CE02' },
        { name: 'UI/UX Design', icon: '✨', level: 75, color: '#FF6B6B' },
        { name: 'React', icon: '⚛️', level: 70, color: '#61DAFB' },
        { name: 'Three.js', icon: '🎪', level: 65, color: '#049EF4' },
        { name: 'Figma', icon: '🎯', level: 85, color: '#F24E1E' }
    ];
    
    const skillsGrid = document.querySelector('.skills-grid');
    
    // Create skill cards
    skills.forEach((skill, index) => {
        const card = document.createElement('div');
        card.className = 'skill-card';
        card.innerHTML = `
            <div class="skill-icon">${skill.icon}</div>
            <h3>${skill.name}</h3>
            <div class="skill-bar">
                <div class="skill-progress" data-level="${skill.level}" 
                     style="background: ${skill.color}"></div>
            </div>
        `;
        
        skillsGrid.appendChild(card);
        
        // Animate progress bar on scroll
        ScrollTrigger.create({
            trigger: card,
            start: 'top 80%',
            onEnter: () => {
                const progressBar = card.querySelector('.skill-progress');
                gsap.to(progressBar, {
                    width: `${skill.level}%`,
                    duration: 1.5,
                    ease: 'power2.out',
                    delay: index * 0.1
                });
                
                // Card animation
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'back.out(1.7)',
                    delay: index * 0.1
                });
            }
        });
    });
}

// 5️⃣ CONTACT SECTION
function initContact() {
    const phoneCard = document.getElementById('phone-card');
    const emailCard = document.getElementById('email-card');
    
    // Phone card animation
    phoneCard.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Ripple effect
        const ripple = this.querySelector('.contact-hover-effect');
        gsap.to(ripple, {
            left: '100%',
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
                gsap.set(ripple, { left: '-100%' });
                window.location.href = this.href;
            }
        });
        
        // Button animation
        gsap.to(this, {
            scale: 0.95,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
    });
    
    // Email card animation
    emailCard.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Animation
        gsap.to(this, {
            y: -10,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                window.location.href = this.href;
            }
        });
    });
    
    // Social buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tooltip = this.getAttribute('data-tooltip');
            alert(`Coming soon: ${tooltip} link akan ditambahkan!`);
            
            // Animation
            gsap.to(this, {
                rotation: 360,
                duration: 0.5,
                ease: 'back.out(1.7)'
            });
        });
    });
}

// 6️⃣ NAVIGATION
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    // Smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Update active link on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// 7️⃣ SCROLL ANIMATIONS
function setupScrollAnimations() {
    // Animate all sections on scroll
    gsap.utils.toArray('section').forEach((section, i) => {
        if (i > 0) { // Skip hero section
            gsap.fromTo(section,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }
    });
}

// 8️⃣ UTILITY FUNCTIONS
function createFloatingEmoji(emoji, element) {
    const emojiElement = document.createElement('div');
    emojiElement.textContent = emoji;
    emojiElement.style.cssText = `
        position: fixed;
        font-size: 2rem;
        pointer-events: none;
        z-index: 10000;
        left: ${element.getBoundingClientRect().left + element.offsetWidth/2}px;
        top: ${element.getBoundingClientRect().top}px;
    `;
    
    document.body.appendChild(emojiElement);
    
    gsap.to(emojiElement, {
        y: -100,
        opacity: 0,
        rotation: Math.random() * 360,
        duration: 1.5,
        ease: 'power2.out',
        onComplete: () => emojiElement.remove()
    });
}

// Add some sparkle effects
function addSparkleEffect() {
    const sparkles = ['✨', '🌟', '⭐', '💫', '☄️'];
    
    setInterval(() => {
        if (Math.random() > 0.7) {
            const sparkle = document.createElement('div');
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.style.cssText = `
                position: fixed;
                font-size: ${Math.random() * 20 + 10}px;
                opacity: ${Math.random() * 0.5 + 0.5};
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                pointer-events: none;
                z-index: 9999;
            `;
            
            document.body.appendChild(sparkle);
            
            gsap.to(sparkle, {
                y: -50,
                x: Math.random() * 100 - 50,
                opacity: 0,
                rotation: Math.random() * 360,
                duration: 2,
                ease: 'power2.out',
                onComplete: () => sparkle.remove()
            });
        }
    }, 1000);
}

// Initialize sparkle effect
setTimeout(addSparkleEffect, 3000);