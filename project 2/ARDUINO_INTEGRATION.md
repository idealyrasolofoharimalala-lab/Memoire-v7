# Guide d'intégration Arduino R4 WiFi

## Configuration Arduino

### Bibliothèques requises
Installez ces bibliothèques via le gestionnaire de bibliothèques Arduino :
- `WiFiS3` (pour Arduino R4 WiFi)
- `ArduinoHttpClient`

### Code Arduino

```cpp
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>

// Configuration WiFi
const char* ssid = "VOTRE_SSID";
const char* password = "VOTRE_MOT_DE_PASSE";

// Configuration Supabase
const char* serverAddress = "0ec90b57d6e95fcbda19832f.supabase.co";
const int port = 443;
const char* path = "/functions/v1/arduino-data";

WiFiSSLClient wifi;
HttpClient client = HttpClient(wifi, serverAddress, port);

void setup() {
  Serial.begin(115200);

  // Connexion WiFi
  Serial.print("Connexion au WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connecté!");
  Serial.print("Adresse IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Lecture des capteurs
  float volumeM3 = lireVolume();        // Remplacer par votre fonction
  float temperature = lireTemperature(); // Remplacer par votre fonction
  float humidity = lireHumidite();      // Remplacer par votre fonction

  // Envoi des données
  envoyerDonnees(volumeM3, temperature, humidity);

  // Attendre 5 minutes avant le prochain envoi
  delay(300000);
}

void envoyerDonnees(float volumeM3, float temperature, float humidity) {
  Serial.println("Envoi des données...");

  // Calculer le volume en litres
  float volumeLitres = volumeM3 * 1000;

  // Créer le JSON
  String jsonData = "{";
  jsonData += "\"volume_m3\":" + String(volumeM3, 3) + ",";
  jsonData += "\"volume_liters\":" + String(volumeLitres, 2) + ",";
  jsonData += "\"temperature\":" + String(temperature, 1) + ",";
  jsonData += "\"humidity\":" + String(humidity, 1);
  jsonData += "}";

  // Envoyer la requête POST
  client.beginRequest();
  client.post(path);
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Content-Length", jsonData.length());
  client.beginBody();
  client.print(jsonData);
  client.endRequest();

  // Lire la réponse
  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  Serial.print("Réponse: ");
  Serial.println(response);

  if (statusCode == 200) {
    Serial.println("✓ Données envoyées avec succès!");
  } else {
    Serial.println("✗ Erreur lors de l'envoi");
  }
}

// Fonctions de lecture des capteurs (à implémenter selon vos capteurs)
float lireVolume() {
  // Exemple : lire un capteur ultrasonique pour mesurer le niveau d'eau
  // et calculer le volume en m3
  // TODO: Implémenter selon votre capteur
  return 1.5; // Exemple
}

float lireTemperature() {
  // Exemple : lire un capteur DHT22
  // TODO: Implémenter selon votre capteur
  return 25.5; // Exemple
}

float lireHumidite() {
  // Exemple : lire un capteur DHT22
  // TODO: Implémenter selon votre capteur
  return 65.0; // Exemple
}
```

## URL de l'endpoint

```
https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/arduino-data
```

## Format des données

L'Arduino doit envoyer les données au format JSON :

```json
{
  "volume_m3": 1.5,
  "volume_liters": 1500,
  "temperature": 25.5,
  "humidity": 65.0
}
```

**Note:** Vous pouvez envoyer seulement certaines valeurs. Par exemple :
- Seulement le volume : `{"volume_m3": 1.5}`
- Seulement la température : `{"temperature": 25.5}`
- Les deux : `{"volume_m3": 1.5, "temperature": 25.5}`

## Capteurs recommandés

### Pour le niveau d'eau
- **HC-SR04** : Capteur ultrasonique pour mesurer la distance
- **Capteur de pression** : Pour mesurer la pression au fond de la cuve

### Pour température et humidité
- **DHT22** : Capteur de température et humidité
- **BME280** : Capteur de température, humidité et pression

## Exemple de calcul du volume

Si vous utilisez un capteur ultrasonique pour mesurer la hauteur d'eau dans une cuve cylindrique :

```cpp
float calculerVolume(float hauteurEauCm, float rayonCuveCm) {
  // Volume = π × r² × h
  float volumeCm3 = 3.14159 * rayonCuveCm * rayonCuveCm * hauteurEauCm;

  // Convertir en m3
  float volumeM3 = volumeCm3 / 1000000.0;

  return volumeM3;
}
```

## Test de l'intégration

Pour tester l'envoi depuis Arduino, ouvrez le moniteur série (115200 baud) et vous verrez :
```
Connexion au WiFi...
WiFi connecté!
Adresse IP: 192.168.1.XX
Envoi des données...
Status code: 200
Réponse: {"success":true,"message":"Données insérées avec succès"}
✓ Données envoyées avec succès!
```

Les données apparaîtront immédiatement sur le dashboard web en temps réel.
