import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-mock-google-login',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mock-google-login.html',
    styleUrl: './mock-google-login.css'
})
export class MockGoogleLogin {
    isLoading = false;

    selectAccount(email: string) {
        this.isLoading = true;
        setTimeout(() => {
            // Mock user data from Google
            const googleUser = {
                email: email,
                fullName: email.split('@')[0], // Mock name
                googleId: 'google_' + Math.floor(Math.random() * 1000000),
                photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
                provider: 'GOOGLE',
                token: 'mock_google_token_' + Date.now()
            };

            // Send message to parent window
            if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_LOGIN_SUCCESS', user: googleUser }, '*');
                window.close();
            } else {
                alert('Cannot communicate with parent window. Please try again.');
                this.isLoading = false;
            }
        }, 1500); // Simulate network delay
    }
}
