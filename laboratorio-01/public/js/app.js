/**
 * @file app.js
 * @author Gabriel Nicolás González Ferreira
 * @brief aplicación que consume la API del servidor de ritmos euclidianos.
 * @version 0.1
 * @date 2026-03-15
 * @license https://opensource.org/licenses/MIT
 */

const inputBpm = document.getElementById('inputBpm');
const valBpm = document.getElementById('valBpm');
const vInputs = document.querySelectorAll('.v-input');

// Esta variable guardará el último patrón calculado
let patronActual = null;

async function solicitarNuevoPatron() {
    const vocesValores = Array.from(vInputs).map(i => parseInt(i.value) || 0);
    
    const payload = {
        bpm: parseInt(inputBpm.value),
        voces: vocesValores
    };

    try {
        const response = await fetch('/api/generar-patron', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        patronActual = await response.json();
        
        // Si ya está sonando, el AudioEngine usará el nuevo patronActual 
        // en el siguiente ciclo gracias a la referencia compartida.
        if (AudioEngine.isPlaying) {
            AudioEngine.actualizarDatosEnCaliente(patronActual);
        }
    } catch (e) {
        console.error("Error de sync:", e);
    }
}

// Eventos para detectar cambios automáticos
inputBpm.oninput = () => {
    valBpm.innerText = inputBpm.value;
    solicitarNuevoPatron();
};

vInputs.forEach(input => {
    input.oninput = () => solicitarNuevoPatron();
});

document.getElementById('btnPlay').onclick = async () => {
    if (AudioEngine.ctx.state === 'suspended') await AudioEngine.ctx.resume();
    await solicitarNuevoPatron();
    AudioEngine.reproducir(patronActual);
};

document.getElementById('btnStop').onclick = () => AudioEngine.detener();

AudioEngine.onPulse = (id) => Visualizer.dibujarPulso(id);