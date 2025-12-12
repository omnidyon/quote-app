import { Component, model } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  type = model<'button' | 'submit' >('button');
  disabled = model<boolean>(false);
}
