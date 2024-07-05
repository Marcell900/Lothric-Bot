const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const commands = [
    {
        name: 'ping',
        description: 'Responde con Pong!'
    },
    {
        name: 'iniciar',
        description: 'Inicia el juego con una clase específica.',
        options: [
            {
                name: 'clase',
                type: 3, // 3 es STRING en discord.js
                description: 'La clase que quieres elegir',
                required: true,
                choices: [
                    { name: 'Guerrero', value: 'Guerrero' },
                    { name: 'Mago', value: 'Mago' },
                    { name: 'Arquero', value: 'Arquero' }
                ]
            }
        ]
    },
    {
        name: 'estado',
        description: 'Muestra el estado actual del jugador.'
    },
    {
        name: 'pelear',
        description: 'Inicia una pelea contra un enemigo aleatorio.'
    }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
