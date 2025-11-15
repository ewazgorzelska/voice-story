# Plan Testów - Voice Story

## 1. Wprowadzenie i Cele

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji Voice Story. Celem planu jest zapewnienie najwyższej jakości produktu poprzez systematyczną weryfikację funkcjonalności, wydajności, bezpieczeństwa i użyteczności. Plan jest dostosowany do specyfiki stosu technologicznego projektu, obejmującego Astro, React, Supabase oraz zewnętrzne API (ElevenLabs, OpenRouter).

### 1.2. Główne Cele Testowania

- **Weryfikacja funkcjonalna:** Zapewnienie, że wszystkie kluczowe funkcje aplikacji, takie jak autentykacja, zarządzanie próbkami głosu i generowanie historii, działają zgodnie z wymaganiami.
- **Zapewnienie stabilności:** Identyfikacja i eliminacja błędów w logice biznesowej oraz interakcjach między komponentami.
- **Gwarancja bezpieczeństwa:** Sprawdzenie, czy dane użytkowników są odpowiednio chronione, a dostęp do zasobów jest kontrolowany przez zdefiniowane polityki (RLS).
- **Optymalizacja wydajności:** Ocena czasu ładowania stron i responsywności interfejsu użytkownika.
- **Walidacja UI/UX:** Zapewnienie spójności wizualnej i intuicyjności interfejsu na różnych urządzeniach i przeglądarkach.
- **Kontrola integracji:** Weryfikacja poprawnej komunikacji z zewnętrznymi serwisami API.

## 2. Architektura i Strategia Testowa

Strategia testowania opiera się na piramidzie testów, z szeroką bazą szybkich testów jednostkowych i integracyjnych oraz węższym wierzchołkiem testów E2E, które pokrywają krytyczne ścieżki użytkownika.

- **Poziom 1: Testy Jednostkowe i Komponentowe:** Każda funkcja w `src/lib/services` oraz każdy komponent React (`.tsx`) będzie posiadał dedykowane testy. Zależności zewnętrzne (Supabase, API) będą mockowane.
- **Poziom 2: Testy Integracyjne:** Testy będą weryfikować współpracę modułów, np. komponent -> hook -> serwis. Skupią się również na testowaniu endpointów API Astro oraz polityk bezpieczeństwa Supabase RLS.
- **Poziom 3: Testy End-to-End (E2E):** Zautomatyzowane testy będą symulować pełne scenariusze użytkownika w przeglądarce, od rejestracji po wygenerowanie historii. Będą uruchamiane na dedykowanym środowisku testowym z osobną instancją Supabase.
- **Testy Dodatkowe:** Uzupełnieniem automatyzacji będą testy wizualnej regresji, testy dostępności (a11y) oraz podstawowe testy wydajnościowe.

## 3. Typy Testów i Zakres

### 3.1. Testy Jednostkowe (Unit Tests)

- **Cel:** Weryfikacja poprawności działania izolowanych fragmentów kodu.
- **Zakres:**
  - **Logika biznesowa:** Wszystkie funkcje w `src/lib/services/`, np. `voiceSampleService.ts`, `storyGenerationService.ts`.
  - **Funkcje pomocnicze:** Narzędzia w `src/lib/utils/` i `src/lib/schemas/`.
  - **Komponenty React:** Komponenty `.tsx` testowane z użyciem React Testing Library.
  - **Komponenty Astro:** Komponenty `.astro` testowane przez renderowanie do HTML i weryfikację struktury DOM lub przez testy E2E dla bardziej złożonych scenariuszy.
  - **Walidacja schematów:** Testy Zod schemas w `src/lib/schemas/` z różnymi przypadkami brzegowymi.
- **Narzędzia:** Vitest, React Testing Library, Happy DOM (dla komponentów Astro).

### 3.2. Testy Integracyjne (Integration Tests)

- **Cel:** Sprawdzenie poprawnej współpracy między modułami aplikacji.
- **Zakres:**
  - **Endpointy API Astro (`src/pages/api/`):**
    - Weryfikacja logiki endpointów, walidacji danych wejściowych i kodów odpowiedzi HTTP poprzez bezpośrednie wywołania funkcji endpointów lub testy z użyciem lokalnego serwera deweloperskiego.
    - Kluczowe endpointy: `api/auth/login`, `api/auth/register`, `api/voice-sample`, `api/story-generations`.
    - Mockowanie zewnętrznych zależności (Supabase, ElevenLabs, OpenRouter) za pomocą MSW lub `vi.mock`.
  - **Komponenty i Hooki:**
    - Testowanie komponentów, które korzystają z hooków do pobierania i modyfikacji danych, np. `StoryLibraryView.tsx` i `useMyLibrary.ts`.
  - **Polityki Bezpieczeństwa Supabase (RLS):**
    - Dedykowane testy z użyciem **lokalnej instancji Supabase** (`supabase start`).
    - Tworzenie wielu użytkowników testowych i weryfikacja, czy RLS poprawnie ogranicza dostęp do danych.
    - Testowanie scenariuszy: dostęp do własnych danych (powinien działać), dostęp do cudzych danych (powinien być zablokowany).
    - Kluczowe tabele: `voice_samples`, `story_generations`, `profiles`.
  - **Integracja z zewnętrznymi API:**
    - Testy kontraktowe weryfikujące zgodność z API ElevenLabs i OpenRouter.
    - Mockowanie odpowiedzi API dla scenariuszy sukcesu i błędów.
- **Narzędzia:** Vitest, Mock Service Worker (MSW), Playwright (dla testów API), Supabase CLI (lokalna instancja).

### 3.3. Testy End-to-End (E2E)

- **Cel:** Weryfikacja pełnych przepływów biznesowych z perspektywy użytkownika.
- **Zakres (krytyczne ścieżki):**
  - **Rejestracja i Logowanie:** Utworzenie konta, logowanie, wylogowanie, reset hasła.
  - **Zarządzanie Próbką Głosu:** Proces nagrywania, wysyłania i weryfikacji próbki głosu.
  - **Generowanie Historii:** Wypełnienie formularza preferencji, uruchomienie generacji, oczekiwanie na wynik.
  - **Biblioteka Użytkownika:** Wyświetlanie, odtwarzanie i usuwanie wygenerowanych historii.
  - **Kontrola Dostępu:** Próba dostępu do chronionych stron (`/my-library`) bez zalogowania.
- **Narzędzia:** Playwright.

### 3.4. Testy Wizualnej Regresji

- **Cel:** Wykrywanie niezamierzonych zmian w interfejsie użytkownika.
- **Zakres:**
  - Główne widoki aplikacji: strona główna, biblioteka historii, panel zarządzania głosem.
  - Kluczowe komponenty UI, np. `GeneratedStoryCard.tsx`.
- **Narzędzia:** Playwright (wbudowane narzędzia do porównywania zrzutów ekranu).

### 3.5. Testy Dostępności (Accessibility, a11y)

- **Cel:** Zapewnienie, że aplikacja jest używalna dla osób z niepełnosprawnościami.
- **Zakres:**
  - Automatyczne skanowanie kluczowych stron pod kątem zgodności ze standardem WCAG 2.1 (poziom AA).
  - Weryfikacja kontrastu kolorów, etykiet formularzy, nawigacji klawiaturowej.
  - Testowanie z czytnikami ekranu (symulacja).
- **Narzędzia:** `@axe-core/playwright` (zintegrowane z testami E2E).

### 3.6. Testy Wydajnościowe (Performance Tests)

- **Cel:** Zapewnienie szybkiego ładowania i responsywności aplikacji.
- **Zakres:**
  - **Core Web Vitals:** Pomiar LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift).
  - **Audyt Lighthouse:** Automatyczne sprawdzanie wydajności, dostępności, SEO i najlepszych praktyk.
  - **Czas ładowania stron:** Kluczowe strony powinny ładować się poniżej 3 sekund.
  - **Rozmiar bundli:** Monitorowanie rozmiaru JavaScript/CSS, optymalizacja code splitting.
  - **Testy obciążeniowe API:** Symulacja wielu równoczesnych żądań do endpointów API.
- **Narzędzia:**
  - **Unlighthouse** - automatyczny audyt wydajności całej aplikacji
  - **Playwright** - pomiary czasu ładowania w ramach testów E2E
  - **Bundle Analyzer** - analiza rozmiaru bundli

### 3.7. Testy Kontraktowe (Contract Tests)

- **Cel:** Weryfikacja zgodności z API zewnętrznych dostawców (ElevenLabs, OpenRouter).
- **Zakres:**
  - Sprawdzenie, czy struktura odpowiedzi z zewnętrznych API odpowiada oczekiwaniom aplikacji.
  - Testowanie różnych kodów odpowiedzi (200, 400, 401, 429, 500).
  - Weryfikacja obsługi limitów rate limiting i błędów.
  - Dokumentowanie kontraktów API dla łatwiejszego debugowania.
- **Narzędzia:** Mock Service Worker (MSW) dla podstawowych testów, opcjonalnie Pact dla zaawansowanych scenariuszy.

## 4. Narzędzia i Frameworki

| Kategoria                        | Narzędzie / Framework             | Zastosowanie                                                              |
| -------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| **Główny framework testowy**     | **Vitest**                        | Testy jednostkowe, integracyjne, coverage, szybkie wykonanie.             |
| **Testowanie komponentów React** | **React Testing Library**         | Testowanie komponentów React w sposób imitujący interakcję użytkownika.   |
| **Testowanie komponentów Astro** | **Happy DOM + Vitest**            | Renderowanie i testowanie komponentów `.astro`.                           |
| **Testowanie E2E i API**         | **Playwright**                    | Automatyzacja przeglądarki, testy E2E, testy API endpoints.               |
| **Testy wizualne**               | **Playwright Visual Comparisons** | Porównywanie zrzutów ekranu (snapshot testing).                           |
| **Testy dostępności**            | **@axe-core/playwright**          | Automatyczne audyty a11y zgodnie z WCAG 2.1.                              |
| **Testy wydajnościowe**          | **Unlighthouse**                  | Audyt wydajności, Core Web Vitals, Lighthouse scores.                     |
| **Analiza bundli**               | **Rollup Plugin Visualizer**      | Wizualizacja rozmiaru bundli, identyfikacja ciężkich zależności.          |
| **Mockowanie HTTP**              | **Mock Service Worker (MSW)**     | Mockowanie requests na poziomie sieci (Supabase, ElevenLabs, OpenRouter). |
| **Mockowanie modułów**           | **vi.mock() (Vitest)**            | Mockowanie zależności w testach jednostkowych.                            |
| **Testy kontraktowe**            | **MSW + TypeScript**              | Weryfikacja zgodności z kontraktami API zewnętrznych dostawców.           |
| **Baza danych testowa**          | **Supabase CLI**                  | Lokalna instancja do testowania RLS, migracji, rzeczywistych zapytań.     |
| **Asercje**                      | **Vitest (wbudowane)**            | Sprawdzanie poprawności wyników testów.                                   |
| **Asercje DOM**                  | **@testing-library/jest-dom**     | Dodatkowe matchery dla testowania elementów DOM.                          |
| **CI/CD**                        | **GitHub Actions**                | Automatyczne uruchamianie testów przy każdym pushu i przed wdrożeniem.    |

## 5. Harmonogram i Priorytety

Testowanie będzie prowadzone równolegle z procesem deweloperskim. Poniżej przedstawiono priorytety w implementacji testów automatycznych.

### Priorytet 0 (Setup infrastruktury testowej)

- **Konfiguracja Vitest:** Setup plików konfiguracyjnych, integracja z TypeScript.
- **Konfiguracja Playwright:** Instalacja, setup przeglądarek, konfiguracja baseURL.
- **Supabase lokalna instancja:** Setup `supabase start` dla testów RLS i integracyjnych.
- **MSW Setup:** Konfiguracja Mock Service Worker dla mockowania API.
- **GitHub Actions:** Podstawowy pipeline CI/CD z uruchamianiem testów.

### Priorytet 1 (Krytyczne - do zaimplementowania w pierwszej kolejności)

- **Testy E2E:** Scenariusze autentykacji (rejestracja, logowanie, wylogowanie).
- **Testy integracyjne RLS:** Polityki Row Level Security dla tabel `voice_samples`, `story_generations`, `profiles`.
- **Testy integracyjne API:** Endpointy w `src/pages/api/auth/` (login, register, logout).
- **Testy jednostkowe:** Kluczowe serwisy: `voiceSampleService.ts`, `storyGenerationService.ts`.
- **Testy schematów Zod:** Walidacja w `src/lib/schemas/` (edge cases, błędne dane).

### Priorytet 2 (Wysoki)

- **Testy E2E:** Pełny przepływ generowania historii (od formularza do wyniku).
- **Testy E2E:** Zarządzanie próbkami głosu (nagrywanie, weryfikacja, usuwanie).
- **Testy komponentów React:** Formularze (`LoginForm.tsx`, `RegisterForm.tsx`, `StoryPreferencesForm.tsx`).
- **Testy komponentów Astro:** Główne komponenty nawigacyjne i layouty.
- **Testy kontraktowe:** Mockowanie i weryfikacja odpowiedzi z ElevenLabs i OpenRouter API.
- **Testy wizualnej regresji:** Dla stron `/my-library`, `/stories`, `/voice-sample`.

### Priorytet 3 (Średni)

- **Testy E2E:** Pozostałe przepływy (paginacja, filtrowanie, sortowanie).
- **Testy jednostkowe:** Pełne pokrycie hooków (`useVoiceSample.ts`, `useStoryGeneration.ts`).
- **Testy jednostkowe:** Pokrycie utilities i helpers (`src/lib/utils/`).
- **Testy dostępności:** Zautomatyzowane skany a11y dla wszystkich publicznych stron.
- **Testy wydajnościowe:** Unlighthouse audyt + monitoring Core Web Vitals.
- **Analiza bundli:** Setup i baseline metrics dla rozmiaru JavaScript/CSS.

## 6. Kryteria Akceptacji i Metryki Jakości

### 6.1. Kryteria Akceptacji

- **Kryterium wejścia:** Nowa funkcja jest gotowa do testów, gdy:
  - Przejdzie code review.
  - Zostanie wdrożona na środowisko testowe z lokalną instancją Supabase.
  - Posiada podstawowe testy jednostkowe (dla logiki biznesowej).
- **Kryterium wyjścia:** Nowa wersja aplikacji może zostać wdrożona na produkcję, gdy:
  - Wszystkie zautomatyzowane testy (jednostkowe, integracyjne, E2E) przechodzą pomyślnie w CI/CD.
  - Nie występują żadne nowe błędy krytyczne ani blokujące.
  - Pokrycie kodu testami utrzymuje się powyżej ustalonych progów (patrz metryki).
  - Audyty dostępności (a11y) nie wykazują błędów krytycznych.
  - Metryki wydajnościowe spełniają minimalne wymagania.
  - Wszystkie polityki RLS zostały zweryfikowane i działają poprawnie.

### 6.2. Metryki Jakości i Progi

#### Pokrycie Kodu Testami (Code Coverage)

- **Logika biznesowa (`src/lib/services/`):** ≥ 85%
- **Hooki (`src/lib/hooks/`):** ≥ 80%
- **Komponenty React:** ≥ 75%
- **Utilities i helpers:** ≥ 80%
- **Endpointy API:** ≥ 90%
- **Narzędzie:** Vitest Coverage (c8/istanbul)

#### Wydajność

- **Lighthouse Score:** ≥ 90 (Performance)
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **Czas ładowania strony głównej:** < 3s
- **Narzędzie:** Unlighthouse + Playwright

#### Dostępność

- **Lighthouse Score (Accessibility):** ≥ 95
- **Liczba błędów krytycznych a11y:** 0
- **Narzędzie:** @axe-core/playwright

#### Stabilność Testów

- **Flakiness rate testów E2E:** < 2%
- **Czas wykonania pełnej suity testów:** < 10 minut
- **Success rate w CI/CD:** ≥ 98%

#### Jakość Kodu

- **Liczba błędów ESLint:** 0 (blokujące)
- **TypeScript errors:** 0
- **Gęstość defektów produkcyjnych:** < 1 błąd/tydzień po pierwszym miesiącu

### 6.3. Raportowanie

- **Częstotliwość:** Cotygodniowe raporty z metryk jakości.
- **Narzędzia:**
  - GitHub Actions (dashboardy CI/CD)
  - Vitest UI (pokrycie i wyniki testów)
  - Unlighthouse Reports (audyty wydajności)
- **Alerty:** Automatyczne powiadomienia przy spadku metryk poniżej progów.

## 7. Przykłady Konfiguracji i Komendy

### 7.1. Instalacja Zależności

```bash
# Główne narzędzia testowe
npm install -D vitest @vitest/ui happy-dom

# React Testing Library
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Playwright (E2E)
npm install -D @playwright/test
npx playwright install

# Mock Service Worker
npm install -D msw

# Narzędzia dostępności
npm install -D @axe-core/playwright

# Narzędzia wydajnościowe
npm install -D @unlighthouse/cli rollup-plugin-visualizer
```

### 7.2. Przykładowe Komendy

```bash
# Testy jednostkowe i integracyjne
npm run test                    # Uruchom wszystkie testy
npm run test:ui                 # Uruchom z interfejsem UI
npm run test:coverage           # Uruchom z raportem pokrycia
npm run test:watch              # Tryb watch dla development

# Testy E2E
npm run test:e2e                # Wszystkie testy E2E
npm run test:e2e:ui             # E2E z interfejsem Playwright
npm run test:e2e:headed         # E2E z widoczną przeglądarką
npm run test:e2e:debug          # Tryb debugowania

# Testy wydajnościowe
npm run test:performance        # Audyt Unlighthouse
npm run analyze:bundle          # Analiza rozmiaru bundli

# Supabase (lokalna instancja)
npx supabase start              # Uruchom lokalną bazę danych
npx supabase stop               # Zatrzymaj lokalną bazę danych
npx supabase db reset           # Reset bazy do czystego stanu
```

### 7.3. Struktura Katalogów Testowych

```
voice-story/
├── src/
│   ├── lib/
│   │   ├── services/
│   │   │   ├── voiceSampleService.ts
│   │   │   └── voiceSampleService.test.ts      # Testy jednostkowe obok kodu
│   │   └── hooks/
│   │       ├── useVoiceSample.ts
│   │       └── useVoiceSample.test.ts
│   └── components/
│       ├── LoginForm.tsx
│       └── LoginForm.test.tsx
├── tests/
│   ├── e2e/                                      # Testy E2E
│   │   ├── auth.spec.ts
│   │   ├── voice-sample.spec.ts
│   │   └── story-generation.spec.ts
│   ├── integration/                              # Testy integracyjne
│   │   ├── api/
│   │   │   └── auth.test.ts
│   │   └── supabase/
│   │       └── rls-policies.test.ts
│   ├── fixtures/                                 # Dane testowe
│   │   ├── users.ts
│   │   └── stories.ts
│   └── mocks/                                    # MSW handlers
│       ├── handlers.ts
│       └── server.ts
├── vitest.config.ts                              # Konfiguracja Vitest
├── playwright.config.ts                          # Konfiguracja Playwright
└── .github/
    └── workflows/
        └── test.yml                              # CI/CD pipeline
```

### 7.4. Kluczowe Punkty Implementacji

#### Testowanie Endpointów API Astro (bez Supertest)

```typescript
// tests/integration/api/auth.test.ts
import { describe, it, expect, beforeAll } from "vitest";

describe("POST /api/auth/login", () => {
  let baseURL: string;

  beforeAll(() => {
    // Zakładamy, że serwer dev działa na localhost:4321
    baseURL = process.env.TEST_BASE_URL || "http://localhost:4321";
  });

  it("should login with valid credentials", async () => {
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("user");
  });

  it("should reject invalid credentials", async () => {
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "wrong@example.com",
        password: "wrongpass",
      }),
    });

    expect(response.status).toBe(401);
  });
});
```

#### Testowanie RLS z lokalną instancją Supabase

```typescript
// tests/integration/supabase/rls-policies.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase RLS Policies", () => {
  const supabaseUrl = "http://localhost:54321";
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;

  it("should allow user to read only their own voice samples", async () => {
    // User 1 - tworzy próbkę
    const user1Client = createClient(supabaseUrl, supabaseKey);
    await user1Client.auth.signInWithPassword({
      email: "user1@test.com",
      password: "password123",
    });

    const { data: sample } = await user1Client
      .from("voice_samples")
      .insert({ phrase_text: "Test phrase" })
      .select()
      .single();

    // User 2 - próbuje odczytać próbkę user1
    const user2Client = createClient(supabaseUrl, supabaseKey);
    await user2Client.auth.signInWithPassword({
      email: "user2@test.com",
      password: "password123",
    });

    const { data, error } = await user2Client.from("voice_samples").select().eq("id", sample.id);

    // Powinno być puste - RLS blokuje dostęp
    expect(data).toHaveLength(0);
  });
});
```

#### Testowanie z Mock Service Worker

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock ElevenLabs API
  http.post("https://api.elevenlabs.io/v1/voices/add", () => {
    return HttpResponse.json({
      voice_id: "mock-voice-id-123",
      name: "Test Voice",
    });
  }),

  // Mock OpenRouter API
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: "Mock story content",
          },
        },
      ],
    });
  }),
];
```

## 8. Podsumowanie

Niniejszy plan testów został zaktualizowany w oparciu o najlepsze praktyki i narzędzia zoptymalizowane dla stosu technologicznego projektu Voice Story (Astro 5, React 19, Supabase, TypeScript). Kluczowe usprawnienia obejmują:

- **Usunięcie Supertest** na rzecz natywnego testowania endpointów Astro (fetch API + Vitest lub Playwright)
- **Dodanie strategii testowania komponentów Astro** z wykorzystaniem Happy DOM
- **Precyzyjne określenie testowania Supabase RLS** z lokalną instancją
- **Wprowadzenie konkretnych narzędzi wydajnościowych** (Unlighthouse)
- **Rozszerzenie o testy kontraktowe** dla zewnętrznych API (ElevenLabs, OpenRouter)
- **Szczegółowe metryki jakości** z konkretnymi progami akceptacji
- **Praktyczne przykłady konfiguracji** gotowe do implementacji

Plan jest teraz w pełni gotowy do wdrożenia i zapewnia kompleksową strategię zapewnienia jakości na wszystkich poziomach aplikacji.
