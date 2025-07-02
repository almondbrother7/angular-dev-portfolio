import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare const grecaptcha: any;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent {
  onSubmit(event: Event) {
    event.preventDefault(); // Stop native submission for now

    const recaptchaSiteKey = "6LdXLW8rAAAAACKgzWk1OrlE0E8F7gGmRXvhB2MC";

    grecaptcha.ready(() => {
      grecaptcha.execute(recaptchaSiteKey, { action: 'submit' }).then((token: string) => {
        // Send token to Firebase to verify
        fetch('http://localhost:5001/Angular-dev-portfolio/us-central1/verifyRecaptcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recaptchaToken: token })
        })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.score >= 0.5) {
            // reCAPTCHA validated - submit form now
            (event.target as HTMLFormElement).submit();
          } else {
            alert('Sorry, we could not verify you as a real user.');
          }
        });
      });
    });
  }
}