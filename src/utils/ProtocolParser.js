export const parseDeviceMessage = (rawData) => {
    // Usa Expressão Regular (Regex) para extrair SÓ o que estiver entre < e >
    const match = rawData.match(/<([^>]+)>/);
    
    // Se a string não tem <alguma coisa>, a gente ignora
    if (!match) return null;

    // Pega o conteúdo limpo (Ex: "GAME,HIT,320,400")
    const content = match[1]; 
    const parts = content.split(',');

    const category = parts[0];
    const action = parts[1];

    if (category === 'GAME') {
        return {
            category,
            action,
            value1: parts[2] ? parseInt(parts[2], 10) : 0, // Tempo de Reação
            value2: parts[3] ? parseInt(parts[3], 10) : 0, // Força da Pancada
        };
    }

    if (category === 'SYS') {
        return {
            category,
            action,
            value1: parts[2] || null, // Contagem (3, 2, 1)
        };
    }

    if (category === 'STAT') {
        return {
            category: 'STAT',
            score: parseInt(parts[1], 10),
            errors: parseInt(parts[2], 10),
            avgTime: parseInt(parts[3], 10),
            avgForce: parseInt(parts[4], 10),
        };
    }

    return null;
};