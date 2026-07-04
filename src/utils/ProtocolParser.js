// Protocolo serial: <CATEGORIA,AÇÃO,V1,V2,...>\n
// Ex: <GAME,HIT,320,400>  <SYS,COUNT,3>  <STAT,TEMP,30,15,2,400,800>

export const parseDeviceMessage = (rawData) => {
    // Regex extrai apenas o conteúdo entre < e > — ignora bytes antes/depois (ruído de buffer BT)
    const match = rawData.match(/<([^>]+)>/);
    
    // Se a string não tem <alguma coisa>, a gente ignora
    if (!match) return null;

    // Pega o conteúdo limpo (Ex: "GAME,HIT,320,400")
    const content = match[1]; 
    const parts = content.split(',');

    const category = parts[0]; // "GAME" | "SYS" | "STAT"
    const action   = parts[1]; // "HIT" | "MISS" | "NEXT" | "TIME" | "COUNT" | "MODE" | "TEMP" | "SURV"

    if (category === 'GAME') {
        return {
            category,
            action,
            value1: parts[2] ? parseInt(parts[2], 10) : 0, // Tempo de Reação (ms)
            value2: parts[3] ? parseInt(parts[3], 10) : 0, // Força da Pancada (ADC 0–4095)
        };
    }

    if (category === 'SYS') {
        return {
            category,
            action,
            value1: parts[2] || null,                        // "TEMP" | "SURV" | número da contagem ("3","2","1")
            value2: parts[3] ? parseInt(parts[3], 10) : null, // Segundos do modo tempo (30, 60, 90, 120)
        };
    }

    if (category === 'STAT') {
        const modo        = parts[1]; // 'TEMP' ou 'SURV'
        const tempoLimite = parts[2]; // '30', '60', '90', '120' (ou '0' para sobrevivência)
        
        // Constrói o texto bonitinho para o Firebase
        // Formata para coincidir exatamente com as strings usadas nas queries do Firestore
        let modoFormatado = 'Desconhecido';
        if (modo === 'TEMP') {
            modoFormatado = `TEMPO (${tempoLimite}s)`;   // Ex: "TEMPO (30s)"
        } else if (modo === 'SURV') {
            modoFormatado = 'SOBREVIVÊNCIA';
        }

        return {
            category: 'STAT',
            matchMode: modoFormatado,           // String pronta para gravar no Firestore
            score:    parseInt(parts[3], 10),   // Total de acertos
            errors:   parseInt(parts[4], 10),   // Total de erros
            avgTime:  parseInt(parts[5], 10),   // Média de tempo de reação (ms)
            avgForce: parseInt(parts[6], 10),   // Média de força de impacto (ADC)
        };
    }

    return null; // Categoria desconhecida — descarta
};
