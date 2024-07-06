require('dotenv').config();
const { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, Events } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const PREFIX = '/';

let players = {};

const classes = {
    'Guerrero': { salud: 150, poderAtaque: 20, defensa: 15, suerte: 5, stamina: 10, peso: 15, aplomo: 10, agilidad: 8 },
    'Mago': { salud: 100, poderAtaque: 30, defensa: 5, suerte: 10, stamina: 15, peso: 5, aplomo: 5, agilidad: 10 },
    'Arquero': { salud: 120, poderAtaque: 25, defensa: 10, suerte: 8, stamina: 12, peso: 10, aplomo: 8, agilidad: 15 }
};

const enemies = [
    {
        nombre: 'Goblin',
        salud: 50,
        poderAtaque: 5,
        defensa: 2,
        suerte: 2,
        estado: null,
        recompensa: { oro: 10, experiencia: 20 },
        ataques: [
            { nombre: 'Golpe', poder: 5, precision: 0.8 },
            { nombre: 'Patada', poder: 7, precision: 0.6 }
        ]
    },
    {
        nombre: 'Troll',
        salud: 200,
        poderAtaque: 15,
        defensa: 10,
        suerte: 3,
        estado: null,
        recompensa: { oro: 50, experiencia: 100 },
        ataques: [
            { nombre: 'Maza', poder: 20, precision: 0.7 },
            { nombre: 'Aplastamiento', poder: 25, precision: 0.5 }
        ]
    },
    {
        nombre: 'Dragón',
        salud: 500,
        poderAtaque: 50,
        defensa: 30,
        suerte: 5,
        estado: null,
        recompensa: { oro: 200, experiencia: 500 },
        ataques: [
            { nombre: 'Aliento de fuego', poder: 40, precision: 0.6 },
            { nombre: 'Golpe con la garra', poder: 30, precision: 0.8 },
            { nombre: 'Coletazo', poder: 25, precision: 0.7 },
            { nombre: 'Embestida', poder: 35, precision: 0.5 },
            { nombre: 'Mordida', poder: 45, precision: 0.4 }
        ]
    },
    {
        nombre: 'Esqueleto',
        salud: 100,
        poderAtaque: 10,
        defensa: 5,
        suerte: 2,
        estado: 'veneno',
        recompensa: { oro: 30, experiencia: 50 },
        ataques: [
            { nombre: 'Corte', poder: 10, precision: 0.7 },
            { nombre: 'Golpe', poder: 8, precision: 0.8 }
        ]
    },
    {
        nombre: 'Hombre Lobo',
        salud: 300,
        poderAtaque: 40,
        defensa: 20,
        suerte: 4,
        estado: 'sangrado',
        recompensa: { oro: 100, experiencia: 200 },
        ataques: [
            { nombre: 'Zarpazo', poder: 35, precision: 0.7 },
            { nombre: 'Mordida', poder: 30, precision: 0.6 }
        ]
    }
];

const getRandomDamage = (baseDamage) => {
    const min = baseDamage * 0.8;
    const max = baseDamage * 1.2;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {

    const player = players[interaction.user.id];
    const enemy = interaction.customId && interaction.customId.includes('fight') ? enemies.find(e => e.nombre === interaction.customId.split('_')[1]) : null;

    if (!player && interaction.commandName !== 'iniciar') {
        return interaction.reply('No has iniciado el juego. Usa /iniciar <clase> para comenzar.');
    }

    if (interaction.commandName === 'iniciar') {
        const clase = interaction.options.getString('clase');
        if (!classes[clase]) {
            return interaction.reply(`Clase inválida. Las opciones son: ${Object.keys(classes).join(', ')}`);
        }
        players[interaction.user.id] = { ...classes[clase], nivel: 1, oro: 0, experiencia: 0, estado: 'normal', mana: 100 };
        return interaction.reply(`Has iniciado el juego como ${clase}`);
    }

    if (interaction.commandName === 'estado') {
        return interaction.reply(`Tu estado actual: Salud: ${player.salud}, Poder de ataque: ${player.poderAtaque}, Defensa: ${player.defensa}, Oro: ${player.oro}, Nivel: ${player.nivel}, Experiencia: ${player.experiencia}, Estado: ${player.estado}, Mana: ${player.mana}`);
    }

    if (interaction.commandName === 'pelear') {
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`atacar_${enemy.nombre}`)
                    .setLabel('Atacar')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`defender_${enemy.nombre}`)
                    .setLabel('Defenderse')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`rodar_${enemy.nombre}`)
                    .setLabel('Rodar')
                    .setStyle(ButtonStyle.Success)
            );
        return interaction.reply({ content: `Te enfrentas a un ${enemy.nombre} con ${enemy.salud} de salud.`, components: [buttons] });
    }

    if (interaction.isButton()) {
        const action = interaction.customId.split('_')[0];
        const enemy = enemies.find(e => e.nombre === interaction.customId.split('_')[1]);

        let playerActionResult;
        let enemyActionResult;
        let playerDamageDealt = 0;
        let enemyDamageDealt = 0;

        if (action === 'atacar') {
            const hitChance = Math.random() * player.suerte - Math.random() * enemy.suerte;
            if (hitChance > -5) {
                playerDamageDealt = getRandomDamage(player.poderAtaque) - enemy.defensa / 2;
                if (playerDamageDealt < 0) playerDamageDealt = 0;
                playerActionResult = `acertaste el ataque y le hiciste ${playerDamageDealt} de daño`;
                enemy.salud -= playerDamageDealt;
            } else {
                playerActionResult = hitChance > -10 ? 'tu ataque fue bloqueado' : 'fallaste el ataque';
            }
        } else if (action === 'defender') {
            playerActionResult = 'te preparaste para defenderte';
        } else if (action === 'rodar') {
            playerActionResult = 'rodaste para evitar el daño';
        }

        await interaction.deferUpdate();

        setTimeout(async () => {
            const enemyAttack = enemy.ataques[Math.floor(Math.random() * enemy.ataques.length)];
            const enemyHitChance = Math.random() * enemy.suerte * enemyAttack.precision - Math.random() * player.suerte;
            if (enemyHitChance > -5) {
                enemyDamageDealt = getRandomDamage(enemyAttack.poder) - player.defensa / 2;
                if (enemyDamageDealt < 0) enemyDamageDealt = 0;
                enemyActionResult = `usó ${enemyAttack.nombre} y te hizo ${enemyDamageDealt} de daño`;
                player.salud -= enemyDamageDealt;
            } else {
                enemyActionResult = enemyHitChance > -10 ? `su ataque ${enemyAttack.nombre} fue bloqueado` : `falló el ataque ${enemyAttack.nombre}`;
            }

            let playerStatusEffect = '';
            if (enemy.estado === 'veneno' && Math.random() > 0.5) {
                player.salud -= 5;
                playerStatusEffect = 'Estás envenenado y pierdes 5 de salud';
            } else if (enemy.estado === 'sangrado' && Math.random() > 0.5) {
                player.salud -= 10;
                playerStatusEffect = 'Estás sangrando y pierdes 10 de salud';
            }

            await interaction.followUp(`Atacaste al ${enemy.nombre} y ${playerActionResult}. El ${enemy.nombre} ${enemyActionResult}. ${playerStatusEffect} Tu salud actual es ${player.salud}.`);
            if (player.salud <= 0) {
                await interaction.followUp('Has sido derrotado. Usa /iniciar para empezar de nuevo.');
                delete players[interaction.user.id];
            } else if (enemy.salud <= 0) {
                player.oro += enemy.recompensa.oro;
                player.experiencia += enemy.recompensa.experiencia;
                await interaction.followUp(`Has derrotado al ${enemy.nombre} y obtuviste ${enemy.recompensa.oro} de oro y ${enemy.recompensa.experiencia} de experiencia.`);
            } else {
                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`atacar_${enemy.nombre}`)
                            .setLabel('Atacar')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`defender_${enemy.nombre}`)
                            .setLabel('Defenderse')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`rodar_${enemy.nombre}`)
                            .setLabel('Rodar')
                            .setStyle(ButtonStyle.Success)
                    );
                await interaction.followUp({ content: `Continúa el combate contra el ${enemy.nombre}. ¿Qué harás ahora?`, components: [buttons] });
    }
});

client.login(process.env.TOKEN);