export default class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('player', 'imagenes/PJ.png');
        this.load.image('enemy', 'imagenes/zombie.png');
        this.load.image('vida', 'imagenes/vida.png');
        this.load.image('municion', 'imagenes/municion.png');
        
    }

    create() {
        
        this.playerLives = 3;
        this.livesText = this.add.text(16, 16, 'Vidas: ' + this.playerLives, { fontSize: '32px', fill: '#fff' });
        this.enemiesDestroyed = 0; // Contador de enemigos eliminados
        this.enemiesDestroyedText = this.add.text(600, 16, 'Enemigos eliminados: 0', { fontSize: '24px', fill: '#fff' });

        this.ammo = 10; // Inicializar la munición
        this.ammoText = this.add.text(16, 570, 'Munición: ' + this.ammo, { fontSize: '24px', fill: '#fff' }); // Mostrar la munición en la parte inferior

        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setSize(100, 100);
        this.player.setOffset(0, 0);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5);

        this.enemies = this.physics.add.group();

        // Crear 4 enemigos al inicio
        for (let i = 0; i < 4; i++) {
            this.spawnEnemy();
        }

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.scaleUpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.scaleDownKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Estado de Game Over (inicialmente falso)
        this.gameOver = false;

        // Temporizador de supervivencia
        this.startTime = this.time.now;
        this.survivalTimeText = this.add.text(16, 50, 'Tiempo de supervivencia: 0', { fontSize: '24px', fill: '#fff' });

        // Agregar temporizador para crear consumibles de vida y munición cada 10 a 15 segundos
        this.time.addEvent({
            delay: Phaser.Math.Between(10000, 15000), // 10 a 15 segundos
            callback: this.spawnLifeConsumable,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: Phaser.Math.Between(10000, 15000), // 10 a 15 segundos
            callback: this.spawnAmmoConsumable,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.gameOver) {
            // Habilitar la detección de la tecla "R" para reiniciar
            this.input.keyboard.on('keydown-R', () => {
                this.scene.restart();
                this.playerLives = 3; // Reiniciar las vidas
                this.livesText.setText('Vidas: ' + this.playerLives); // Actualizar el texto de las vidas
                this.enemiesDestroyed = 0; // Reiniciar el contador de enemigos eliminados
                this.enemiesDestroyedText.setText('Enemigos eliminados: 0'); // Actualizar el texto del contador
                this.ammo = 10; // Reiniciar la munición
                this.ammoText.setText('Munición: ' + this.ammo); // Actualizar el texto de la munición
                this.startTime = this.time.now; // Reiniciar el temporizador
                this.survivalTimeText.setText('Tiempo de supervivencia: 0'); // Reiniciar el texto del temporizador
                this.gameOver = false; // Reiniciar el estado de Game Over
            });
        } else {
            let velocityX = 0;
            let velocityY = 0;

            if (this.cursors.left.isDown || this.aKey.isDown) {
                velocityX = -160;
            } else if (this.cursors.right.isDown || this.dKey.isDown) {
                velocityX = 160;
            }

            if (this.cursors.up.isDown || this.wKey.isDown) {
                velocityY = -160;
            } else if (this.cursors.down.isDown || this.sKey.isDown) {
                velocityY = 160;
            }

            this.player.setVelocity(velocityX, velocityY);

            if (this.scaleUpKey.isDown) {
                this.player.setScale(this.player.scaleX + 0.01, this.player.scaleY + 0.01);
            }

            if (this.scaleDownKey.isDown) {
                this.player.setScale(this.player.scaleX - 0.01, this.player.scaleY - 0.01);
            }

            this.enemies.children.iterate(function (enemy) {
                this.physics.moveToObject(enemy, this.player, 100);
                let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.rotation = angle;
            }, this);

            // Actualizar el tiempo de supervivencia
            let survivalTime = (this.time.now - this.startTime) / 1000; // Convertir a segundos
            this.survivalTimeText.setText('Tiempo de supervivencia: ' + survivalTime.toFixed(2));
        }
    }

    enemyCollision(player, enemy) {
        // Obtener el cooldown actual del enemigo
        let cooldown = enemy.getData('cooldown');

        // Verificar si el cooldown ha pasado
        if (this.time.now > cooldown) {
            // Establecer un nuevo cooldown para este enemigo (3 segundos)
            enemy.setData('cooldown', this.time.now + 3000);

            // Disminuir vidas del jugador
            this.playerLives--;
            this.livesText.setText('Vidas: ' + this.playerLives);

            // Ejemplo: Lógica para game over si el jugador se queda sin vidas
            if (this.playerLives === 0) {
                // Mostrar texto de Game Over
                this.add.text(600, 200, 'Game Over', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5);

                // Mostrar texto para reiniciar
                this.add.text(600, 300, 'Presione "R" para reiniciar', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

                // Mostrar tiempo de supervivencia
                let survivalTime = (this.time.now - this.startTime) / 1000; // Convertir a segundos
                this.add.text(600, 400, `Tiempo de supervivencia: ${survivalTime.toFixed(2)} segundos`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

                // Detener la actualización del juego
                this.gameOver = true;
            }
        }
    }

    // Función para manejar el clic en un enemigo
    enemyClicked(enemy) {
        if (this.ammo > 0) { // Solo ejecutar si hay munición
            // Eliminar el enemigo del juego
            enemy.destroy();
            this.enemiesDestroyed++; // Incrementar el contador de enemigos eliminados
            this.enemiesDestroyedText.setText('Enemigos eliminados: ' + this.enemiesDestroyed); // Actualizar el texto del contador

            // Restar una bala
            this.ammo--;
            this.ammoText.setText('Munición: ' + this.ammo); // Actualizar el texto de la munición

            let spawnChance = Phaser.Math.RND.frac();
            let numEnemiesToSpawn = spawnChance < 0.7 ? 1 : 2;

            // Spawn de nuevos enemigos
            for (let i = 0; i < numEnemiesToSpawn; i++) {
                this.spawnEnemy();
            }
        }
    }

    // Función para generar un enemigo en una posición aleatoria, evitando cercanía al jugador
    spawnEnemy() {
        let spawnDistance = 200; // Distancia mínima entre el jugador y un nuevo enemigo

        let posX, posY;
        do {
            posX = Phaser.Math.Between(0, 800);
            posY = Phaser.Math.Between(0, 600);
        } while (Phaser.Math.Distance.Between(posX, posY, this.player.x, this.player.y) < spawnDistance);

        let enemy = this.enemies.create(posX, posY, 'enemy');
        enemy.setSize(100, 100);
        enemy.setOffset(0, 0);
        enemy.setCollideWorldBounds(true);
        enemy.setScale(0.5);

        // Agregar propiedad de datos 'cooldown' a cada enemigo
        enemy.setData('cooldown', 0);

        // Detectar colisiones entre el jugador y los enemigos
        this.physics.add.collider(this.player, enemy, this.enemyCollision, null, this);

        // Habilitar la interactividad del mouse para hacer clic en los enemigos
        enemy.setInteractive();
        enemy.on('pointerdown', () => {
            this.enemyClicked(enemy);
        });
    }

    // Función para generar un consumible de vida en una posición aleatoria, evitando cercanía a los bordes
    spawnLifeConsumable() {
        let posX = Phaser.Math.Between(100, 700);
        let posY = Phaser.Math.Between(100, 500);

        let life = this.physics.add.sprite(posX, posY, 'vida');
        life.setSize(50, 50);
        life.setCollideWorldBounds(true);
        life.setScale(0.5);

        // Habilitar la interactividad del mouse para hacer clic en el consumible de vida
        life.setInteractive();
        life.on('pointerdown', () => {
            this.lifeClicked(life);
        });
    }

    // Función para manejar el clic en el consumible de vida
    lifeClicked(life) {
        life.destroy(); // Eliminar el consumible de vida del juego
        this.playerLives++; // Incrementar las vidas del jugador
        this.livesText.setText('Vidas: ' + this.playerLives); // Actualizar el texto de las vidas
    }

    // Función para generar un consumible de munición en una posición aleatoria, evitando cercanía a los bordes
    spawnAmmoConsumable() {
        let posX = Phaser.Math.Between(100, 700);
        let posY = Phaser.Math.Between(100, 500);

        let ammo = this.physics.add.sprite(posX, posY, 'municion');
        ammo.setSize(50, 50);
        ammo.setCollideWorldBounds(true);
        ammo.setScale(0.5);

        // Habilitar la interactividad del mouse para hacer clic en el consumible de munición
        ammo.setInteractive();
        ammo.on('pointerdown', () => {
            this.ammoClicked(ammo);
        });
    }

    // Función para manejar el clic en el consumible de munición
    ammoClicked(ammo) {
        ammo.destroy(); // Eliminar el consumible de munición del juego
        this.ammo += 20; // Incrementar la munición del jugador
        this.ammoText.setText('Munición: ' + this.ammo); // Actualizar el texto de la munición
    }
}
