# Diagram Architektury Autentykacji

Ten diagram przedstawia kompleksowy przepływ autentykacji w aplikacji Voice Story, obejmujący rejestrację, logowanie, wylogowanie, odzyskiwanie hasła oraz ochronę tras.

```mermaid
sequenceDiagram
    autonumber
    participant Przeglądarka
    participant Middleware
    participant AstroAPI
    participant SupabaseAuth

    Note over Przeglądarka,SupabaseAuth: REJESTRACJA NOWEGO UŻYTKOWNIKA (US-001)

    Przeglądarka->>Middleware: GET /register
    activate Middleware
    Middleware->>Middleware: Sprawdź ciasteczka sesji
    alt Sesja istnieje
        Middleware-->>Przeglądarka: Przekierowanie 302 do /library
    else Brak sesji
        Middleware-->>Przeglądarka: Renderuj stronę /register
    end
    deactivate Middleware

    Przeglądarka->>Przeglądarka: Użytkownik wypełnia formularz
    Przeglądarka->>Przeglądarka: Walidacja po stronie klienta
    Note right of Przeglądarka: Email: RFC 5322<br/>Hasło: min 12 znaków,<br/>wielka, mała litera, cyfra

    Przeglądarka->>AstroAPI: POST /api/auth/register<br/>{email, password, passwordConfirm}
    activate AstroAPI
    AstroAPI->>AstroAPI: Walidacja Zod schema

    alt Błąd walidacji
        AstroAPI-->>Przeglądarka: 422 Validation failed
        deactivate AstroAPI
    else Walidacja OK
        AstroAPI->>SupabaseAuth: signUp({email, password})
        activate SupabaseAuth

        alt Email już istnieje (US-010)
            SupabaseAuth-->>AstroAPI: Error: email-already-exists
            deactivate SupabaseAuth
            AstroAPI-->>Przeglądarka: 400 EMAIL_IN_USE
            deactivate AstroAPI
            Przeglądarka->>Przeglądarka: Wyświetl błąd inline
        else Rejestracja udana
            SupabaseAuth->>SupabaseAuth: Utwórz użytkownika
            SupabaseAuth->>SupabaseAuth: Generuj tokeny
            SupabaseAuth-->>AstroAPI: {user, session}
            deactivate SupabaseAuth

            AstroAPI->>AstroAPI: Ustaw ciasteczka httpOnly secure
            Note right of AstroAPI: sb-access-token<br/>sb-refresh-token<br/>sameSite=strict
            AstroAPI-->>Przeglądarka: 201 {success, redirectPath}
            deactivate AstroAPI

            Przeglądarka->>Przeglądarka: Przekierowanie do /onboarding/voice<br/>lub /library
        end
    end

    Note over Przeglądarka,SupabaseAuth: LOGOWANIE UŻYTKOWNIKA (US-002)

    Przeglądarka->>Middleware: GET /login
    activate Middleware
    Middleware->>Middleware: Sprawdź ciasteczka sesji
    alt Sesja istnieje
        Middleware-->>Przeglądarka: Przekierowanie 302 do /library
    else Brak sesji
        Middleware-->>Przeglądarka: Renderuj stronę /login
    end
    deactivate Middleware

    Przeglądarka->>Przeglądarka: Użytkownik wypełnia formularz
    Przeglądarka->>Przeglądarka: Walidacja po stronie klienta

    Przeglądarka->>AstroAPI: POST /api/auth/login<br/>{email, password}
    activate AstroAPI
    AstroAPI->>AstroAPI: Walidacja Zod schema

    AstroAPI->>SupabaseAuth: signInWithPassword({email, password})
    activate SupabaseAuth

    alt Nieprawidłowe dane (US-009)
        SupabaseAuth-->>AstroAPI: Error: invalid-credentials
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 400 INVALID_CREDENTIALS
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Wyświetl błąd inline
    else Logowanie udane
        SupabaseAuth->>SupabaseAuth: Weryfikuj hasło
        SupabaseAuth->>SupabaseAuth: Generuj tokeny
        SupabaseAuth-->>AstroAPI: {user, session}
        deactivate SupabaseAuth

        AstroAPI->>AstroAPI: Ustaw ciasteczka httpOnly secure
        AstroAPI-->>Przeglądarka: 200 {success, redirectPath}
        deactivate AstroAPI

        Przeglądarka->>Przeglądarka: Przekierowanie do strony docelowej
    end

    Note over Przeglądarka,SupabaseAuth: OCHRONA TRAS - Token Ważny (US-012)

    Przeglądarka->>Middleware: GET /library (chroniona trasa)
    activate Middleware
    Middleware->>Middleware: Odczytaj ciasteczka sesji

    Middleware->>SupabaseAuth: getUser() z tokenem
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Weryfikuj token JWT
    SupabaseAuth-->>Middleware: {user}
    deactivate SupabaseAuth

    Middleware->>Middleware: Zapisz user w locals.session
    Middleware-->>Przeglądarka: Renderuj stronę /library
    deactivate Middleware

    Note over Przeglądarka,SupabaseAuth: OCHRONA TRAS - Token Wygasły (US-012)

    Przeglądarka->>Middleware: GET /library (chroniona trasa)
    activate Middleware
    Middleware->>Middleware: Odczytaj ciasteczka sesji

    Middleware->>SupabaseAuth: getUser() z tokenem
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Token wygasły
    SupabaseAuth->>SupabaseAuth: Odśwież z refresh token

    alt Refresh token ważny
        SupabaseAuth->>SupabaseAuth: Generuj nowy access token
        SupabaseAuth-->>Middleware: {user, nowa sesja}
        deactivate SupabaseAuth
        Middleware->>Middleware: Zaktualizuj ciasteczka
        Middleware->>Middleware: Zapisz user w locals.session
        Middleware-->>Przeglądarka: Renderuj stronę /library
        deactivate Middleware
    else Refresh token nieważny
        SupabaseAuth-->>Middleware: Error: invalid token
        deactivate SupabaseAuth
        Middleware-->>Przeglądarka: Przekierowanie 302 do /login
        deactivate Middleware
    end

    Note over Przeglądarka,SupabaseAuth: OCHRONA TRAS - Brak Sesji (US-012)

    Przeglądarka->>Middleware: GET /library (chroniona trasa)
    activate Middleware
    Middleware->>Middleware: Odczytaj ciasteczka sesji
    Middleware->>Middleware: Brak ciasteczek
    Middleware-->>Przeglądarka: Przekierowanie 302 do /login
    deactivate Middleware

    Note over Przeglądarka,SupabaseAuth: WYLOGOWANIE (US-003)

    Przeglądarka->>Przeglądarka: Kliknięcie przycisku Logout
    Przeglądarka->>AstroAPI: POST /api/auth/logout
    activate AstroAPI

    AstroAPI->>SupabaseAuth: signOut({scope: 'global'})
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Unieważnij refresh token
    SupabaseAuth->>SupabaseAuth: Usuń sesję z bazy
    SupabaseAuth-->>AstroAPI: {success}
    deactivate SupabaseAuth

    AstroAPI->>AstroAPI: Wyczyść ciasteczka sesji
    AstroAPI-->>Przeglądarka: 204 No Content
    deactivate AstroAPI

    Przeglądarka->>Middleware: GET /login
    activate Middleware
    Middleware-->>Przeglądarka: Renderuj stronę /login
    deactivate Middleware

    Note over Przeglądarka,SupabaseAuth: ODZYSKIWANIE HASŁA (US-011 część 1)

    Przeglądarka->>Middleware: GET /auth/forgot-password
    activate Middleware
    Middleware-->>Przeglądarka: Renderuj stronę forgot-password
    deactivate Middleware

    Przeglądarka->>Przeglądarka: Użytkownik wpisuje email
    Przeglądarka->>AstroAPI: POST /api/auth/password-reset<br/>{email}
    activate AstroAPI

    AstroAPI->>SupabaseAuth: resetPasswordForEmail(email)
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Generuj token odzyskiwania
    SupabaseAuth->>SupabaseAuth: Wyślij email z linkiem
    Note right of SupabaseAuth: Link zawiera:<br/>type=recovery<br/>token=xyz
    SupabaseAuth-->>AstroAPI: {success}
    deactivate SupabaseAuth

    AstroAPI-->>Przeglądarka: 200 RESET_EMAIL_SENT
    deactivate AstroAPI
    Przeglądarka->>Przeglądarka: Wyświetl komunikat sukcesu

    Note over Przeglądarka,SupabaseAuth: RESET HASŁA - Token Ważny (US-011 część 2)

    Przeglądarka->>Middleware: GET /auth/reset?type=recovery&token=xyz
    activate Middleware
    Middleware->>Middleware: Sprawdź parametry URL
    Middleware-->>Przeglądarka: Renderuj formularz reset hasła
    deactivate Middleware

    Przeglądarka->>Przeglądarka: Użytkownik wpisuje nowe hasło
    Przeglądarka->>Przeglądarka: Walidacja po stronie klienta

    Przeglądarka->>AstroAPI: POST /api/auth/password-update<br/>{token, password}
    activate AstroAPI

    AstroAPI->>SupabaseAuth: exchangeCodeForSession(token)
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Weryfikuj token
    SupabaseAuth->>SupabaseAuth: Ustanów sesję
    SupabaseAuth-->>AstroAPI: {session}
    deactivate SupabaseAuth

    AstroAPI->>SupabaseAuth: updateUser({password})
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Zaktualizuj hasło
    SupabaseAuth-->>AstroAPI: {user}
    deactivate SupabaseAuth

    AstroAPI->>AstroAPI: Ustaw nowe ciasteczka sesji
    AstroAPI-->>Przeglądarka: 200 {success}
    deactivate AstroAPI

    Przeglądarka->>Middleware: GET /login?reset=success
    activate Middleware
    Middleware-->>Przeglądarka: Renderuj /login z toast sukcesu
    deactivate Middleware

    Note over Przeglądarka,SupabaseAuth: RESET HASŁA - Token Nieważny (US-011)

    Przeglądarka->>Middleware: GET /auth/reset?type=recovery&token=invalid
    activate Middleware
    Middleware->>Middleware: Sprawdź parametry URL
    Middleware-->>Przeglądarka: Renderuj błąd i link do forgot-password
    deactivate Middleware

    Note over Przeglądarka,SupabaseAuth: DOSTĘP DO CHRONIONEGO API

    Przeglądarka->>AstroAPI: POST /api/story-generations<br/>(chroniony endpoint)
    activate AstroAPI
    AstroAPI->>AstroAPI: Sprawdź locals.session z middleware

    alt Brak sesji
        AstroAPI-->>Przeglądarka: 401 Unauthorized
        deactivate AstroAPI
    else Sesja istnieje
        AstroAPI->>AstroAPI: Wykonaj logikę biznesową
        AstroAPI-->>Przeglądarka: 200 {data}
        deactivate AstroAPI
    end
```

## Kluczowe elementy architektury

### 1. Aktorzy systemu

- **Przeglądarka**: Klient renderujący strony Astro i komponenty React
- **Middleware**: Warstwa pośrednia Astro weryfikująca sesje przy każdym żądaniu
- **Astro API**: Endpointy REST w `/api/auth/*` obsługujące operacje autentykacji
- **Supabase Auth**: Zewnętrzny serwis zarządzający tożsamością i sesjami

### 2. Mechanizmy bezpieczeństwa

- Ciasteczka httpOnly, secure, sameSite=strict
- Tokeny JWT z czasem wygaśnięcia 3600s
- Automatyczna rotacja refresh tokenów
- Walidacja po stronie klienta i serwera (Zod schemas)
- Rate limiting dla endpointów logowania i resetu hasła
- Haszowanie emaili w logach audytowych (SHA-256)

### 3. Przepływy autentykacji

- **Rejestracja**: Formularz → Walidacja → Supabase signUp → Sesja → Przekierowanie
- **Logowanie**: Formularz → Walidacja → Supabase signInWithPassword → Sesja → Przekierowanie
- **Ochrona tras**: Middleware → Weryfikacja tokenu → Odświeżenie jeśli wygasły → Renderowanie lub przekierowanie
- **Wylogowanie**: Przycisk → Supabase signOut → Wyczyszczenie ciasteczek → Przekierowanie
- **Reset hasła**: Email → Link z tokenem → Nowe hasło → Aktualizacja → Logowanie

### 4. Obsługa błędów

- `INVALID_CREDENTIALS`: Nieprawidłowy email lub hasło (US-009)
- `EMAIL_IN_USE`: Email już zarejestrowany (US-010)
- `EXPIRED_OR_INVALID_TOKEN`: Token resetu wygasły lub nieprawidłowy
- `RESET_EMAIL_SENT`: Sukces wysłania emaila z resetem
- Błędy walidacji wyświetlane inline w formularzach
- Globalne komunikaty błędów dla nieoczekiwanych sytuacji

### 5. Integracja z istniejącymi funkcjonalnościami

- Po rejestracji/logowaniu przekierowanie do `/onboarding/voice` jeśli brak próbki głosu
- Middleware chroni trasy generowania historii, biblioteki i nagrywania głosu
- API generowania historii wymaga sesji przed wywołaniem ElevenLabs/OpenRouter
- Sesja dostępna w `Astro.locals.session` dla wszystkich stron i API
