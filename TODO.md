# Release-Vorbereitung KifelServiceApp

## Vor App-Store-Veröffentlichung

### Apple (iOS)
- [x] `ascAppId` in `eas.json` eintragen (App Store Connect → App-Informationen → Apple ID)
- [ ] APNs Key in EAS hochladen (`eas credentials`)

### Google (Android)
- [ ] `google-service-account.json` erstellen (Play Console → Setup → API access) und ins Projekt-Root legen
- [ ] `google-services.json` von Firebase Console herunterladen und ins Projekt-Root legen

### EAS / Expo
- [x] `eas init` ausführen
- [x] `"owner"` in `app.json` auf euren EAS Dev-Account ändern (`"amelkantarevic"`)

### Optional
- [x] Google Maps API Key erstellen (Cloud Console → Maps Static API) und in `.env` eintragen — nur nötig für PDF-Export mit Routen-Karten
