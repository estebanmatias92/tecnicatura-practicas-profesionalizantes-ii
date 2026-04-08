/**
 * @file visualizer.js
 * @author Gabriel Nicolás González Ferreira
 * @brief helper para representar visualmente los ritmos.
 * @version 0.1
 * @date 2026-03-15
 * @license https://opensource.org/licenses/MIT
 */

const Visualizer = {
    canvas: document.getElementById('ritmoCanvas'),
    ctx: document.getElementById('ritmoCanvas').getContext('2d'),
    colores: ['#00FF41', '#00CC00', '#008F11', '#ADFF2F', '#7FFF00', '#32CD32', '#9ACD32', '#FFFF00'],

    init() {
        this.limpiar();
    },

    limpiar() {
        // Fondo semi-transparente para el efecto de estela
        this.ctx.fillStyle = 'rgba(26, 26, 26, 0.2)'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        requestAnimationFrame(() => this.limpiar());
    },

    dibujarPulso(vozId) {
        const index = (vozId - 1) % 8;
        const fila = index < 4 ? 0 : 1;
        const col = index % 4;
        
        const x = (this.canvas.width / 4) * col + (this.canvas.width / 8);
        const y = (this.canvas.height / 2) * (fila + 0.5);
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colores[index];
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.colores[index];
        this.ctx.fill();
        this.ctx.shadowBlur = 0; // Reset para no afectar otros dibujos
    }
};

Visualizer.init();