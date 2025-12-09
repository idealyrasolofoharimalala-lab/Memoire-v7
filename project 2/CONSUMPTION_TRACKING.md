# Système de Suivi de la Consommation d'Eau et Pluie Récupérée

## Vue d'ensemble

Le système calcule automatiquement :
- **Eau consommée**: Diminution du niveau d'eau entre deux mesures
- **Pluie récupérée**: Augmentation du niveau d'eau (eau de pluie captée)

## Fonctionnement

### Logique de calcul

Pour chaque nouvelle mesure, le système compare le volume précédent avec le volume actuel :

```
difference = volume_précédent - volume_actuel

Si difference > 0 (volume diminue):
  - Eau consommée = difference
  - Pluie récupérée = 0

Si difference < 0 (volume augmente):
  - Eau consommée = 0
  - Pluie récupérée = |difference|

Si difference = 0 (pas de changement):
  - Eau consommée = 0
  - Pluie récupérée = 0
```

### Exemple

```
Mesure 1: 1000 L (08:00)
Mesure 2: 950 L  (09:00)
  → Eau consommée = 50 L
  → Pluie récupérée = 0 L

Mesure 3: 980 L  (10:00)
  → Eau consommée = 0 L
  → Pluie récupérée = 30 L (augmentation due à la pluie)
```

## Structure de la base de données

### Table: water_levels

Colonnes ajoutées :

```sql
water_consumed_liters NUMERIC DEFAULT 0
  - Quantité d'eau consommée depuis la dernière mesure (en litres)
  - Calculée automatiquement par un trigger

rain_recovered_liters NUMERIC DEFAULT 0
  - Quantité d'eau de pluie récupérée depuis la dernière mesure (en litres)
  - Calculée automatiquement par un trigger
```

### Trigger: water_consumption_trigger

Le trigger s'exécute **avant chaque insertion** et :
1. Récupère la mesure précédente la plus récente
2. Calcule la différence de volume
3. Assigne la valeur au champ approprié
4. Assigne 0 à l'autre champ

```sql
CREATE TRIGGER water_consumption_trigger
BEFORE INSERT ON water_levels
FOR EACH ROW
EXECUTE FUNCTION calculate_water_consumption();
```

## Utilisation dans l'application

### Historique des niveaux d'eau

Affiche pour chaque mesure :
- Volume en m³ et litres
- Eau consommée (en rouge si > 0)
- Pluie récupérée (en vert si > 0)

```
📊 2024-12-06 10:00:00
  1.000 m³ • 1000 L
  ⚠️ Consommation: 50.00 L
  ☁️ Pluie: 0.00 L
```

### Recherche historique

Permet de consulter la consommation et pluie récupérée pour une date/heure spécifique.

### Statistiques

Affiche les totaux pour la période sélectionnée :
- **Total consommé**: Somme de toute l'eau consommée
- **Pluie récupérée**: Somme de toute l'eau de pluie récupérée

```
Total consommé: 245.50 L
Pluie récupérée: 125.30 L
```

## Cas d'usage

### Détecter les fuites

Si la consommation augmente sans utilisation apparente → fuite possible

### Analyser les variations saisonnières

- Augmentation de la consommation en été
- Augmentation de la pluie récupérée en saison des pluies

### Planifier l'approvisionnement

- Prévoir l'ajout d'eau en fonction de la consommation
- Évaluer la contribution de la récupération de pluie

### Évaluer l'efficacité du système

- Ratio consommation/pluie récupérée
- Durabilité du réservoir

## Limitations

1. **Première mesure**: Pas de calcul (pas de mesure précédente)
2. **Perte/Fuite en cas de panne**: Non détectée si le système est arrêté
3. **Évaporation**: Pas distinguée de la consommation d'eau

## Données en temps réel

Les colonnes `water_consumed_liters` et `rain_recovered_liters` sont mises à jour en temps réel dès l'ajout d'une nouvelle mesure.

### API

Lors d'une insertion dans la table `water_levels` :

```json
POST /supabase/rest/v1/water_levels
{
  "volume_m3": 1.000,
  "volume_liters": 1000,
  "timestamp": "2024-12-06T10:00:00Z"
}

Réponse automatique:
{
  "id": 1,
  "volume_m3": 1.000,
  "volume_liters": 1000,
  "water_consumed_liters": 50.00,
  "rain_recovered_liters": 0.00,
  "timestamp": "2024-12-06T10:00:00Z"
}
```

## Maintenance

Le système fonctionne entièrement de manière automatisée :
- Aucune intervention manuelle requise
- Calcul instantané lors de l'insertion
- Historique préservé pour analyse

## Évolutions possibles

1. **Alertes de consommation**: Notifier si consommation > seuil
2. **Graphiques de tendance**: Visualiser consommation vs pluie
3. **Prédictions**: Estimer la date d'épuisement du réservoir
4. **Compensation évaporation**: Ajouter formule d'évaporation basée sur météo
5. **Alertes de fuite**: Détection automatique de consommation anormale

## Intégration Arduino

Le système Arduino peut continuer à envoyer uniquement :
- `volume_m3`
- `volume_liters`
- `timestamp`

Le calcul de consommation et pluie récupérée est géré automatiquement par la base de données.
