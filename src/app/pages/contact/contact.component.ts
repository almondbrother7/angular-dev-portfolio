import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent {

}
