import { ImageZone } from './ImageZone.js';
import { TextZone } from './TextZone.js';

export class EditCanvas {
  constructor(container, page) {
    this.container = container;
    this.page = page;
  }

  render() {
    this.container.innerHTML = `
      <div class="edit-canvas" style="display: flex; height: 100%;">
        <div id="image-zone-container" style="flex: 55%; border-right: 1px solid var(--border-default); display: flex; flex-direction: column;"></div>
        <div id="text-zone-container" style="flex: 45%; display: flex; flex-direction: column;"></div>
      </div>
    `;

    this.imageZone = new ImageZone(
      this.container.querySelector('#image-zone-container'), 
      this.page
    );
    this.imageZone.render();

    this.textZone = new TextZone(
      this.container.querySelector('#text-zone-container'), 
      this.page
    );
    this.textZone.render();
  }
}
