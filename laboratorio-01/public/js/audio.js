/**
 * @file audio.js
 * @author Gabriel Nicolás González Ferreira
 * @brief motor de audio del frontend.
 * @version 0.1
 * @date 2026-03-15
 * @license https://opensource.org/licenses/MIT
 */

const AudioEngine = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    onPulse: null,
    nextLoopTimeout: null,
    isPlaying: false,

    actualizarDatosEnCaliente(nuevosDatos) {
        // Reemplazamos los datos que el loop de programarCapa está usando
        this.datosActuales = nuevosDatos; 
    },

    crearClick(tiempo, frecuencia, vozId) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(frecuencia, tiempo);
        gain.gain.setValueAtTime(0.2, tiempo);
        gain.gain.exponentialRampToValueAtTime(0.0001, tiempo + 0.04);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(tiempo); osc.stop(tiempo + 0.05);

        const delayMs = (tiempo - this.ctx.currentTime) * 1000;
        setTimeout(() => { if(this.isPlaying) this.onPulse(vozId); }, delayMs);
    },

    reproducir(data) {
        this.datosActuales = data; // Guardamos referencia
        this.isPlaying = true;
        
        const programarCapa = () => {
            if (!this.isPlaying) return;
            const inicio = this.ctx.currentTime + 0.05;
            const d = this.datosActuales; // Usamos la referencia que puede cambiar "en caliente"
            
            Object.keys(d).forEach((key, index) => {
                if (key.startsWith('voz_')) {
                    const freq = 150 + (index * 100);
                    d[key].forEach(offset => this.crearClick(inicio + offset, freq, index + 1));
                }
            });
    
            this.nextLoopTimeout = setTimeout(programarCapa, d.duracion_ciclo * 1000);
        };
        programarCapa();
    },

    detener() {
        this.isPlaying = false;
        clearTimeout(this.nextLoopTimeout);
    }


};