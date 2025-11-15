# Product Requirements Document (PRD) - Voice Story App

## 1. Product Overview

The Voice Story App is a web application that allows users to create personalized bedtime stories for children, narrated in the user's own voice. By recording a short voice sample, the application uses AI-powered voice cloning to generate audio narrations for a predefined library of classic fairy tales. The primary goal of the MVP is to provide a simple and magical experience for parents to create unique stories for their children.

## 2. User Problem

Parents often seek new and engaging ways to connect with their children, especially during moments like bedtime. Traditional storytelling is a cherished activity, but parents may lack the time or variety of stories to keep it fresh. The Voice Story App solves this by enabling a parent, grandparent, or loved one to "narrate" a story using their own voice, even when they are not physically present, creating a comforting and personal experience for the child.

## 3. Functional Requirements

### 3.1. User Authentication

- Users must be able to register for a new account using an email and password.
- Users must be able to recover forgotten passsword.
- Registered users must be able to log in to their account.
- The system must securely store user credentials.

### 3.2. Voice Management

- Users must be able to record a 30-60 second voice sample directly through the web interface.
- The recording process must include a verification step where the user reads a randomly generated phrase.
- The application will use the ElevenLabs API to clone the user's voice from the sample.
- Each user account is limited to one saved voice clone.
- Users must have an option in their account settings to delete their voice sample and the associated voice clone at any time, without having to delete their entire account.

### 3.3. Story Library and Generation

- The application will provide a predefined library of 5-10 classic fairy tales.
- The backend will use the OpenRouter API to generate personalized story scripts tailored to user preferences while keeping the library as the starting point.
- Users can browse and select a story from the library to generate an audio version.
- Before starting generation, users must provide the child's age and desired minimum and maximum audio duration (in whole minutes); these inputs are mandatory and validated.
- Users may optionally enter a thematic prompt (up to 200 characters) describing the key motif of the story (e.g., “a sad dragon and a wise princess”).
- Each generation request must return a concise teaser/summary of the story to display on the selection page in addition to the full audio.
- During story generation, a progress indicator with an estimated completion time will be displayed.

### 3.4. User Library and Playback

- All generated audio stories will be saved to a personal "My Library" section for the user.
- The audio player will have simple controls: play, pause, and volume.
- The application will support background audio playback.

### 3.5. Technical Architecture

- The application will be a web application accessible via a browser.
- The backend will be built with a RESTful API.
- All user data, especially voice recordings, will be handled with end-to-end encryption.

### 3.6. User Data Management
- **Account Deletion:** Users must have a clear and accessible option in their account settings to permanently delete their account.
- **Data Purge Process:** Triggering account deletion must initiate a permanent and irreversible purge of all associated personal data (including credentials, voice sample, voice clone, and generated stories) within a defined period (e.g., 30 days), which will be clearly communicated to the user.

## 4. Product Boundaries

The following features are explicitly out of scope for the MVP:

- Social login options (e.g., Google, Apple).
- Support for multiple saved voice clones per account.
- Users providing their own text for story generation.
- Assigning different voices to different characters within a story.
- A native mobile application (iOS or Android).
- An in-app user feedback mechanism.
- Advanced library features like search, filtering, or categories.
- Monetization features (subscriptions, one-time purchases).

## 5. User Stories

- ID: US-001
- Title: New User Registration
- Description: As a new user, I want to create an account using my email and password so that I can access the application.
- Acceptance Criteria:
  - Given I am a new user on the registration page
  - When I enter a valid email and a password
  - And I click the "Register" button
  - Then my account is created
  - And I am logged in and redirected to the main application page.

- ID: US-002
- Title: Existing User Login
- Description: As a registered user, I want to log in with my email and password so that I can access my account and stories.
- Acceptance Criteria:
  - Given I am a registered user on the login page
  - When I enter my correct email and password
  - And I click the "Log In" button
  - Then I am successfully authenticated
  - And I am redirected to my personal library page.

- ID: US-003
- Title: User Logout
- Description: As a logged-in user, I want to log out of the application to secure my account.
- Acceptance Criteria:
  - Given I am a logged-in user
  - When I click the "Logout" button
  - Then my session is terminated
  - And I am redirected to the login page.

- ID: US-004
- Title: Voice Sample Recording
- Description: As a new user, I want to record a short voice sample so that the application can clone my voice for story narration.
- Acceptance Criteria:
  - Given I am a logged-in user who has not yet provided a voice sample
  - When I start the voice recording process
  - Then I am presented with a randomly generated phrase to read
  - And I am able to record myself reading the phrase
  - And I can review and re-record the sample
  - When I submit the recording
  - Then the voice sample is saved to my account.

- ID: US-005
- Title: Browse Story Library
- Description: As a user, I want to browse the available stories so I can choose one to generate.
- Acceptance Criteria:
  - Given I am a logged-in user
  - When I navigate to the story library
  - Then I see a list of 5-10 available stories with their titles.

- ID: US-006
- Title: Story Generation
- Description: As a user, I want to select a story and generate an audio version with my cloned voice based on my child’s preferences.
- Acceptance Criteria:
  - Given I am a logged-in user with a saved voice sample
  - When I select a story from the library, provide the child's age, enter the desired minimum and maximum audio duration, optionally add a motif description of up to 200 characters, and click "Generate"
  - Then the story generation process begins using the OpenRouter API
  - And a progress indicator is displayed with an estimated time
  - And the generated story includes a teaser summary stored alongside the audio
  - When the process is complete, the new story appears in "My Library".

- ID: US-011
- Title: Provide Story Preferences
- Description: As a user, I want to specify key preferences for the generated story so that the narration matches my child’s needs.
- Acceptance Criteria:
  - Given I am a logged-in user preparing to generate a story
  - When I enter the child's age and minimum/maximum audio duration (in minutes)
  - Then the system validates the inputs before allowing submission
  - And the stored preferences are included in the OpenRouter request for generating the story content.

- ID: US-007
- Title: Access Personal Library
- Description: As a user, I want to view all the stories I have generated in one place.
- Acceptance Criteria:
  - Given I am a logged-in user
  - When I navigate to the "My Library" section
  - Then I see a list of all the stories I have previously generated.

- ID: US-008
- Title: Play a Generated Story
- Description: As a user, I want to play a generated story so my child can listen to it.
- Acceptance Criteria:
  - Given I am in my personal library
  - When I click the "Play" button on a story
  - Then the audio begins to play
  - And I can use controls to pause, resume, and adjust the volume.

- ID: US-009
- Title: Invalid Login Attempt
- Description: As a user, I want to see an error message if I try to log in with incorrect credentials.
- Acceptance Criteria:
  - Given I am on the login page
  - When I enter an incorrect email or password
  - And I click the "Log In" button
  - Then an error message is displayed stating "Invalid email or password"
  - And I remain on the login page.

- ID: US-010
- Title: Registration with Existing Email
- Description: As a user, I want to be notified if I try to register with an email that is already in use.
- Acceptance Criteria:
  - Given I am on the registration page
  - When I enter an email that is already associated with an account
  - And I click the "Register" button
  - Then an error message is displayed stating "This email is already registered"
  - And I remain on the registration page.

- ID: US-011
- Title: Recover the Forgotten Pasword
- Description: As a user, I want to be able to recover my password.
- Acceptance Criteria:
  - Given I am on the login page
  - When I click the Forgotten pasword button
  - I am notified that my password has been reset and to check my email
  - When I click the link sent by e-mail from supabase
  - I am redirected back to the app to the new password view
  - When I enter the new password and click on the Save button
  - Then I am notified that the password has been successfully updated

- ID: US-012
- Title: Safe Access
- Description: As a user, I want to be able to log in the system in a safe manner that would keep my personal data (in particular my voice stories) secured.
- Acceptance Criteria:
  - An unauthenticated user can access the login, registration, and password recovery pages.
  - An unauthenticated user cannot access other pages related to story generation functionalities.
  - The user can log out of the system via a dedicated button in the navigation menu.
  - Login and registration are handled on dedicated pages.
  - Password recovery should be possible.

- ID: US-013
- Title: Explicit Consent for Voice Cloning
- Description: As a user, before I record my voice, I want to be clearly informed about how it will be used and to provide my explicit consent, so I feel in control of my biometric data.
- Acceptance Criteria:
  - Given I am about to record my voice for the first time.
  - When the recording interface loads, I am shown a message explaining the voice cloning process, its purpose, and its use of a third-party service.
  - Then I must check a box stating "I consent to the use of my voice sample to create a digital voice for story narration as described in the Privacy Policy" before the "Record" button is enabled.

- ID: US-014
- Title: User Deletes Account and All Personal Data
- Description: As a user, I want a straightforward way to permanently delete my account and all my data, including my voice recordings, so I can leave the service with peace of mind.
- Acceptance Criteria:
  - Given I am a logged-in user in my account settings.
  - When I click a "Delete Account" button and confirm my choice in a subsequent warning modal.
  - Then my account is scheduled for deletion, and I am logged out.
  - And all my personal data (credentials, voice sample, generated stories) is permanently deleted from the service's systems within the timeframe stated in the Privacy Policy.


## 6. Success Metrics

The primary success metric for the MVP will be user engagement, measured by the "weekly story creation rate." This metric tracks the total number of stories generated by active users each week. A consistent or growing rate will indicate that the core feature is valuable and that users are returning to the application.


