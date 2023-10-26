import {THREE} from './threeD.js';


/**
 * @namespace
 * @description A module for creating custom entities and components.
 */
export const entity = (() => {

  /**
   * @class Entity
   * @classdesc A class representing an entity in the game world.
   */
  class Entity {
    constructor() {
      /**
       * @member {string} name_
       * @memberof Entity
       * @instance
       * @description The name of the entity.
       */
      this.name_ = null;
      /**
       * @member {number} entityId_
       * @memberof Entity
       * @instance
       * @description The ID of the entity.
       */
      this.entityId_ = null;
      /**
       * @member {Object} entityComponents_
       * @memberof Entity
       * @instance
       * @description The components attached to the entity.
       */
      this.entityComponents_ = {};
      /**
       * @member {Object} entityAttributes_
       * @memberof Entity
       * @instance
       * @description The attributes of the entity.
       */
      this.entityAttributes_ = {};

      /**
       * @member {THREE.Vector3} _position
       * @memberof Entity
       * @instance
       * @private
       * @description The position of the entity.
       */
      this._position = new THREE.Vector3();
      /**
       * @member {THREE.Quaternion} _rotation
       * @memberof Entity
       * @instance
       * @private
       * @description The rotation of the entity.
       */
      this._rotation = new THREE.Quaternion();
      /**
       * @member {Object} eventHandlers_
       * @memberof Entity
       * @instance
       * @private
       * @description The event handlers for the entity.
       */
      this.eventHandlers_  = {};
      /**
       * @member {Entity} entityParent_
       * @memberof Entity
       * @instance
       * @description The parent entity of this entity.
       */
      this.entityParent_ = null;
      /**
       * @member {boolean} isEntityDead_
       * @memberof Entity
       * @instance
       * @description Whether the entity is dead or not.
       */
      this.isEntityDead_ = false;
    }

    /**
     * @method Destroy
     * @memberof Entity
     * @instance
     * @description Destroys the entity and its components.
     */
    Destroy() {
      for (let k in this.entityComponents_) {
        this.entityComponents_[k].Destroy();
      }
      this.entityComponents_ = null;
      this.entityParent_ = null;
      this.eventHandlers_  = null;
    }

    /**
     * @method RegisterHandler_
     * @memberof Entity
     * @instance
     * @private
     * @description Registers an event handler for the entity.
     * @param {string} n - The name of the event.
     * @param {Function} h - The event handler function.
     */
    RegisterHandler_(n, h) {
      if (!(n in this.eventHandlers_ )) {
        this.eventHandlers_ [n] = [];
      }
      this.eventHandlers_ [n].push(h);
    }

    /**
     * @method SetParent
     * @memberof Entity
     * @instance
     * @description Sets the parent entity of this entity.
     * @param {Entity} p - The parent entity.
     */
    SetParent(p) {
      this.entityParent_ = p;
    }

    /**
     * @method SetName
     * @memberof Entity
     * @instance
     * @description Sets the name of the entity.
     * @param {string} n - The name of the entity.
     */
    SetName(n) {
      this.name_ = n;
    }

    /**
     * @method SetId
     * @memberof Entity
     * @instance
     * @description Sets the ID of the entity.
     * @param {number} id - The ID of the entity.
     */
    SetId(id) {
      this.entityId_ = id;
    }

    /**
     * @member {string} Name
     * @memberof Entity
     * @instance
     * @description The name of the entity.
     */
    get Name() {
      return this.name_;
    }

    /**
     * @member {number} ID
     * @memberof Entity
     * @instance
     * @description The ID of the entity.
     */
    get ID() {
      return this.entityId_;
    }

    /**
     * @member {Entity} Manager
     * @memberof Entity
     * @instance
     * @description The parent entity of this entity.
     */
    get Manager() {
      return this.entityParent_;
    }

    /**
     * @member {Object} Attributes
     * @memberof Entity
     * @instance
     * @description The attributes of the entity.
     */
    get Attributes() {
      return this.entityAttributes_;
    }

    /**
     * @member {boolean} IsDead
     * @memberof Entity
     * @instance
     * @description Whether the entity is dead or not.
     */
    get IsDead() {
      return this.isEntityDead_;
    }

    /**
     * @method SetActive
     * @memberof Entity
     * @instance
     * @description Sets the active state of the entity.
     * @param {boolean} b - The active state of the entity.
     */
    SetActive(b) {
      this.entityParent_.SetActive(this, b);
    }

    /**
     * @method SetDead
     * @memberof Entity
     * @instance
     * @description Sets the entity as dead.
     */
    SetDead() {
      this.isEntityDead_ = true;
    }

    /**
     * @method AddComponent
     * @memberof Entity
     * @instance
     * @description Adds a component to the entity.
     * @param {Component} c - The component to add.
     */
    AddComponent(c) {
      c.SetParent(this);
      this.entityComponents_[c.constructor.name] = c;

      c.InitComponent();
    }

    /**
     * @method InitEntity
     * @memberof Entity
     * @instance
     * @description Initializes the entity and its components.
     */
    InitEntity() {
      for (let k in this.entityComponents_) {
        this.entityComponents_[k].InitEntity();
      }
    }

    /**
     * @method GetComponent
     * @memberof Entity
     * @instance
     * @description Gets a component from the entity.
     * @param {string} n - The name of the component.
     * @returns {Component} The component.
     */
    GetComponent(n) {
      return this.entityComponents_[n];
    }

    /**
     * @method FindEntity
     * @memberof Entity
     * @instance
     * @description Finds an entity by name.
     * @param {string} n - The name of the entity to find.
     * @returns {Entity} The entity.
     */
    FindEntity(n) {
      return this.entityParent_.Get(n);
    }

    /**
     * @method Broadcast
     * @memberof Entity
     * @instance
     * @description Broadcasts a message to the entity's event handlers.
     * @param {Object} msg - The message to broadcast.
     */
    Broadcast(msg) {
      if (this.IsDead) {
        return;
      }
      if (!(msg.topic in this.eventHandlers_ )) {
        return;
      }

      for (let curHandler of this.eventHandlers_ [msg.topic]) {
        curHandler(msg);
      }
    }

    /**
     * @method SetPosition
     * @memberof Entity
     * @instance
     * @description Sets the position of the entity.
     * @param {THREE.Vector3} p - The position of the entity.
     */
    SetPosition(p) {
      this._position.copy(p);
      this.Broadcast({
          topic: 'update.position',
          value: this._position,
      });
    }

    /**
     * @method SetQuaternion
     * @memberof Entity
     * @instance
     * @description Sets the quaternion of the entity.
     * @param {THREE.Quaternion} r - The quaternion of the entity.
     */
    SetQuaternion(r) {
      this._rotation.copy(r);
      this.Broadcast({
          topic: 'update.rotation',
          value: this._rotation,
      });
    }

    /**
     * @member {THREE.Vector3} Position
     * @memberof Entity
     * @instance
     * @description The position of the entity.
     */
    get Position() {
      return this._position;
    }

    /**
     * @member {THREE.Quaternion} Quaternion
     * @memberof Entity
     * @instance
     * @description The quaternion of the entity.
     */
    get Quaternion() {
      return this._rotation;
    }

    /**
     * @member {THREE.Vector3} Forward
     * @memberof Entity
     * @instance
     * @description The forward vector of the entity.
     */
    get Forward() {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this._rotation);
      return forward;
    }

    /**
     * @member {THREE.Vector3} Left
     * @memberof Entity
     * @instance
     * @description The left vector of the entity.
     */
    get Left() {
      const forward = new THREE.Vector3(-1, 0, 0);
      forward.applyQuaternion(this._rotation);
      return forward;
    }

    /**
     * @member {THREE.Vector3} Up
     * @memberof Entity
     * @instance
     * @description The up vector of the entity.
     */
    get Up() {
      const forward = new THREE.Vector3(0, 1, 0);
      forward.applyQuaternion(this._rotation);
      return forward;
    }

    /**
     * @method Update
     * @memberof Entity
     * @instance
     * @description Updates the entity and its components.
     * @param {number} timeElapsed - The time elapsed since the last update.
     * @param {number} pass - The pass number.
     */
    Update(timeElapsed, pass) {
      for (let k in this.entityComponents_) {
        const c = this.entityComponents_[k];
        if (c.Pass == pass) {
          c.Update(timeElapsed);
        }
      }
    }
  };

  /**
   * @class Component
   * @classdesc A class representing a component of an entity.
   */
  class Component {
    constructor() {
      this.entityParent_ = null;
      this.pass_ = 0;
      this.paused = false
    }

        //START PAUSE FUNCTIONALITY

        pause() {
          this.paused = true;
        }
      
        resume() {
          this.paused = false;
        }
      
        togglePause() {
          this.paused = !this.paused;
        }
        // END PAUSE FUNCTIONALITY

    /**
     * @method Destroy
     * @memberof Component
     * @instance
     * @description Destroys the component.
     */
    Destroy() {
    }

    /**
     * @method SetParent
     * @memberof Component
     * @instance
     * @description Sets the parent entity of this component.
     * @param {Entity} p - The parent entity.
     */
    SetParent(p) {
      this.entityParent_ = p;
    }

    /**
     * @method SetPass
     * @memberof Component
     * @instance
     * @description Sets the pass number.
     * @param {number} p - The pass number.
     */
    SetPass(p) {
      this.pass_ = p;
    }

    /**
     * @member {number} Pass
     * @memberof Component
     * @instance
     * @description The pass number.
     */
    get Pass() {
      return this.pass_;
    }

    /**
     * @method InitComponent
     * @memberof Component
     * @instance
     * @description Initializes the component.
     */
    InitComponent() {}
    
    /**
     * @method InitEntity
     * @memberof Component
     * @instance
     * @description Initializes the entity.
     */
    InitEntity() {}

    /**
     * @method GetComponent
     * @memberof Component
     * @instance
     * @description Gets a component from the parent entity.
     * @param {string} n - The name of the component.
     * @returns {Component} The component.
     */
    GetComponent(n) {
      return this.entityParent_.GetComponent(n);
    }

    /**
     * @member {Entity} Manager
     * @memberof Component
     * @instance
     * @description The parent entity of this component.
     */
    get Manager() {
      return this.entityParent_.Manager;
    }

    /**
     * @member {Entity} Parent
     * @memberof Component
     * @instance
     * @description The parent entity of this component.
     */
    get Parent() {
      return this.entityParent_;
    }

    /**
     * @method FindEntity
     * @memberof Component
     * @instance
     * @description Finds an entity by name.
     * @param {string} n - The name of the entity to find.
     * @returns {Entity} The entity.
     */
    FindEntity(n) {
      return this.entityParent_.FindEntity(n);
    }

    /**
     * @method Broadcast
     * @memberof Component
     * @instance
     * @description Broadcasts a message to the parent entity's event handlers.
     * @param {Object} m - The message to broadcast.
     */
    Broadcast(m) {
      this.entityParent_.Broadcast(m);
    }

    /**
     * @method Update
     * @memberof Component
     * @instance
     * @description Updates the component.
     * @param {number} _ - The time elapsed since the last update.
     */
    Update(_) {}

    /**
     * @method RegisterHandler_
     * @memberof Component
     * @instance
     * @private
     * @description Registers an event handler for the parent entity.
     * @param {string} n - The name of the event.
     * @param {Function} h - The event handler function.
     */
    RegisterHandler_(n, h) {
      this.entityParent_.RegisterHandler_(n, h);
    }
  };

  return {
    Entity: Entity,
    Component: Component,
  };

})();