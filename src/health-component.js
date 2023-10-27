import {entity} from "./customEntity.js";

export const health_component = (() => {

  // HealthComponent class that manages health-related functionalities
  class HealthComponent extends entity.Component {
    constructor(params) {
      super();
      this.stats_ = {...params}; // Initializing stats object with parameters
    }

    // Initialization of component with event handler registrations
    InitComponent() {
      this.RegisterHandler_('shot.hit', (m) => this.OnDamage_(m)); // Registering damage handler
      this.RegisterHandler_('health.add-experience', (m) => this.OnAddExperience_(m)); // Registering experience gain handler

      this.UpdateUI_(); // Updating UI elements
    }

    // Initialization of entity and setting of stats
    InitEntity() {
      this.Parent.Attributes.Stats = this.stats_;
    }

    // Check if the entity is alive based on health
    IsAlive() {
      return this.stats_.health > 0;
    }

    // Getter for health value
    get Health() {
      return this.stats_.health;
    }

    // Update the UI elements based on the stats
    UpdateUI_() {
      if (!this.stats_.updateUI) {
        return;
      }

      const bar = document.getElementById('health-bar'); // Update the health bar element
    }

    // Compute the required experience for the next level based on the current level
    _ComputeLevelXPRequirement() {
      const level = this.stats_.level;
      const xpRequired = Math.round(2 ** (level - 1) * 100);
      return xpRequired;
    }

    // Handle experience addition based on received message
    OnAddExperience_(msg) {
      this.stats_.experience += msg.value; // Add experience value from the message
      const requiredExperience = this._ComputeLevelXPRequirement(); // Compute required experience for the next level
      if (this.stats_.experience < requiredExperience) {
        return;
      }

      // Increase stats and level upon reaching required experience
      this.stats_.level += 1;
      this.stats_.strength += 1;
      this.stats_.wisdomness += 1;
      this.stats_.benchpress += 1;
      this.stats_.curl += 2;

      // Spawn level up component for visual effect
      const spawner = this.FindEntity('level-up-spawner').GetComponent('LevelUpComponentSpawner');
      spawner.Spawn(this.Parent.Position);

      // Broadcast level gain event to other components
      this.Broadcast({
        topic: 'health.levelGained',
        value: this.stats_.level,
      });

      this.UpdateUI_(); // Update UI elements after level gain
    }

    // Handle entity death
    OnDeath_() {
      this.Broadcast({
        topic: 'health.death',
      });
    }

    // Handle changes in health value
    OnHealthChanged_() {
      if (this.stats_.health == 0) {
        this.OnDeath_(); // Call death handler if health is zero
      }

      // Broadcast health update event with current and maximum health values
      this.Broadcast({
        topic: 'health.update',
        health: this.stats_.health,
        maxHealth: this.stats_.maxHealth,
      });

      this.UpdateUI_(); // Update UI elements after health change
    }

    // Handle damage taken based on received message
    OnDamage_(msg) {
      const oldHealth = this.stats_.health;
      this.stats_.health = Math.max(0.0, this.stats_.health - 25); // Decrease health by a fixed amount

      // Call health change handler if the health has changed
      if (oldHealth != this.stats_.health) {
        this.OnHealthChanged_();
      }
    }
  };

  return {
    HealthComponent: HealthComponent, // Export the HealthComponent class
  };

})();
