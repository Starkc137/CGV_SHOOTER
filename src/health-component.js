import {entity} from "./customEntity.js";


export const health_component = (() => {

  class HealthComponent extends entity.Component {
    constructor(params) {
      super();
      this.stats_ = {...params};
    }

    InitializeComponent() {
      this.addEventHandler_(
          'shot.hit', (m) => this.OnDamage_(m));
      this.addEventHandler_(
          'health.add-experience', (m) => this.OnAddExperience_(m));

      this.UpdateUI_();
    }

    InitializeEntity() {
      this.Parent.Attributes.Stats = this.stats_;
    }

    IsAlive() {
      return this.stats_.health > 0;
    }

    get Health() {
      return this.stats_.health;
    }

    UpdateUI_() {
      if (!this.stats_.updateUI) {
        return;
      }

      const bar = document.getElementById('health-bar');
;
    }

    _ComputeLevelXPRequirement() {
      const level = this.stats_.level;
      const xpRequired = Math.round(2 ** (level - 1) * 100);
      return xpRequired;
    }

    OnAddExperience_(msg) {
      this.stats_.experience += msg.value;
      const requiredExperience = this._ComputeLevelXPRequirement();
      if (this.stats_.experience < requiredExperience) {
        return;
      }

      this.stats_.level += 1;
      this.stats_.strength += 1;
      this.stats_.wisdomness += 1;
      this.stats_.benchpress += 1;
      this.stats_.curl += 2;

      const spawner = this.FindEntity(
          'level-up-spawner').GetComponent('LevelUpComponentSpawner');
      spawner.Spawn(this.Parent.Position);

      this.BroadcastEvent({
          topic: 'health.levelGained',
          value: this.stats_.level,
      });

      this.UpdateUI_();
    }

    OnDeath_() {
      this.BroadcastEvent({
          topic: 'health.death',
      });
    }

    OnHealthChanged_() {
      if (this.stats_.health == 0) {
        this.OnDeath_();
      }

      this.BroadcastEvent({
        topic: 'health.update',
        health: this.stats_.health,
        maxHealth: this.stats_.maxHealth,
      });

      this.UpdateUI_();
    }

    OnDamage_(msg) {
      const oldHealth = this.stats_.health;
      this.stats_.health = Math.max(0.0, this.stats_.health - 25);

      if (oldHealth != this.stats_.health) {
        this.OnHealthChanged_();
      }
    }
  };

  return {
    HealthComponent: HealthComponent,
  };

})();