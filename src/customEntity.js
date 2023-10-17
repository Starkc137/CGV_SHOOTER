import {THREE} from './threeD.js';

/**
 * Entity component system (ECS) is a software architectural pattern mostly used in video game development for the representation of game world objects. 
 * An ECS comprises entities composed from components of data, with systems which operate on entities' components.
 * ECS follows the principle of composition over inheritance, meaning that every entity is defined not by a type hierarchy, 
 * but by the components that are associated with it. Systems act globally over all entities which have the required components.
 * 
 * Javascript does not have an entity component system built in, so we this one is inspired by @SimonDEv who used a more component based system.
 * We follow the same pattern.
 */

/**
 * @fileoverview This file contains the CustomEntity and Component classes, which are used to represent game objects in a game engine context.
 * @version 1.0.0
 */

/**
 * An entity represents a general-purpose object. In a game engine context, every coarse game object is represented as an entity.
 * Usually, it only consists of a unique id.
 */
export const entity = (() => {

  class CustomEntity {
    constructor() {
      this.name_ = null;
      this.entityId_ = null;
      this.entityComponents_ = {};
      this.entityAttributes_ = {};
      this._position = new THREE.Vector3();
      this.entityRotation_ = new THREE.Quaternion();
      this.eventHandlers_ = {};
      this.entityParent_ = null;
      this.isEntityDead_ = false;
    }

    /**
     * Removes the entity and all its components from the game.
     */
    removeEntity() {
      for (let key in this.entityComponents_) {
        this.entityComponents_[key].removeEntity();
      }
      this.entityComponents_ = null;
      this.entityParent_ = null;
      this.eventHandlers_ = null;
    }

    /**
     * Adds an event handler for the given event name.
     * @param {string} eventName - The name of the event to handle.
     * @param {function} h - The event handler function.
     */
    addEventHandler_(eventName, h) {
      if (!(eventName in this.eventHandlers_)) {
        this.eventHandlers_[eventName] = [];
      }
      this.eventHandlers_[eventName].push(h);
    }

    /**
     * Sets the parent entity of this entity.
     * @param {CustomEntity} parent - The parent entity.
     */
    setParentEntity(parent) {
      this.entityParent_ = parent;
    }

    /**
     * Sets the name of the entity.
     * @param {string} entityName - The name of the entity.
     */
    SetName(entityName) {
      this.entityName_ = entityName;
    }

    /**
     * Sets the id of the entity.
     * @param {number} id - The id of the entity.
     */
    setEntityId(id) {
      this.entityId_ = id;
    }

    /**
     * Returns the name of the entity.
     * @returns {string} The name of the entity.
     */
    get Name() {
      return this.entityName_;
    }

    /**
     * Returns the id of the entity.
     * @returns {number} The id of the entity.
     */
    get ID() {
      return this.entityId_;
    }

    /**
     * Returns the parent entity of this entity.
     * @returns {CustomEntity} The parent entity.
     */
    get Manager() {
      return this.entityParent_;
    }

    /**
     * Returns the attributes of the entity.
     * @returns {object} The attributes of the entity.
     */
    get Attributes() {
      return this.entityAttributes_;
    }

    /**
     * Returns whether the entity is dead or not.
     * @returns {boolean} Whether the entity is dead or not.
     */
    get IsDead() {
      return this.isEntityDead_;
    }

    /**
     * Sets the active status of the entity.
     * @param {boolean} status - The active status of the entity.
     */
    setActiveStatus(status) {
      this.entityParent_.setActiveStatus(this, status);
    }

    /**
     * Sets the entity to dead.
     */
    setEntityDead() {
      this.isEntityDead_ = true;
    }

    /**
     * Adds a component to the entity.
     * @param {Component} component - The component to add.
     */
    addEntityComponent(component) {
      component.setParentEntity(this);
      this.entityComponents_[component.constructor.name] = component;

      component.InitializeComponent();
    }

    /**
     * Initializeializes the entity and all its components.
     */
    InitializeEntity() {
      for (let key in this.entityComponents_) {
        this.entityComponents_[key].InitializeEntity();
      }
    }

    /**
     * Returns the component with the given name.
     * @param {string} name - The name of the component to get.
     * @returns {Component} The component with the given name.
     */
    GetComponent(name) {
      return this.entityComponents_[name];
    }

    /**
     * Finds the entity with the given name.
     * @param {string} name - The name of the entity to find.
     * @returns {CustomEntity} The entity with the given name.
     */
    FindEntity(name) {
      return this.entityParent_.Get(name);
    }

    /**
     * Broadcasts an event to all event handlers.
     * @param {object} message - The message to broadcast.
     */
    BroadcastEvent(message) {
      if (this.IsDead) {
        return;
      }
      if (!(message.topic in this.eventHandlers_)) {
        return;
      }

      for (let curHandler of this.eventHandlers_[message.topic]) {
        curHandler(message);
      }
    }

    /**
     * Sets the position of the entity.
     * @param {THREE.Vector3} p - The position to set.
     */
    SetPosition(p) {
      this._position.copy(p);
      this.BroadcastEvent({
          topic: 'update.position',
          value: this._position,
      });
    }

    /**
     * Sets the quaternion of the entity.
     * @param {THREE.Quaternion} r - The quaternion to set.
     */
    SetQuaternion(r) {
      this.entityRotation_.copy(r);
      this.BroadcastEvent({
          topic: 'update.rotation',
          value: this.entityRotation_,
      });
    }

    /**
     * Returns the position of the entity.
     * @returns {THREE.Vector3} The position of the entity.
     */
    get Position() {
      return this._position;
    }

    /**
     * Returns the quaternion of the entity.
     * @returns {THREE.Quaternion} The quaternion of the entity.
     */
    get Quaternion() {
      return this.entityRotation_;
    }

    /**
     * Returns the forward vector of the entity.
     * @returns {THREE.Vector3} The forward vector of the entity.
     */
    get Forward() {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.entityRotation_);
      return forward;
    }

    /**
     * Returns the left vector of the entity.
     * @returns {THREE.Vector3} The left vector of the entity.
     */
    get Left() {
      const forward = new THREE.Vector3(-1, 0, 0);
      forward.applyQuaternion(this.entityRotation_);
      return forward;
    }

    /**
     * Returns the up vector of the entity.
     * @returns {THREE.Vector3} The up vector of the entity.
     */
    get Up() {
      const forward = new THREE.Vector3(0, 1, 0);
      forward.applyQuaternion(this.entityRotation_);
      return forward;
    }

    /**
     * Updates the entity and all its components.
     * @param {number} timeElapsed - The time elapsed since the last update.
     * @param {number} pass - The pass number.
     */
    Update(timeElapsed, pass) {
      for (let key in this.entityComponents_) {
        const component = this.entityComponents_[key];
        if (component.Pass == pass) {
          component.Update(timeElapsed);
        }
      }
    }
  };

  class Component {
    constructor() {
      this.entityParent_ = null;
      this.pass_ = 0;
    }

    /**
     * Removes the component from the entity.
     */
    removeEntity() {
    }

    /**
     * Sets the parent entity of the component.
     * @param {CustomEntity} p - The parent entity.
     */
    setParentEntity(p) {
      this.entityParent_ = p;
    }

    /**
     * Sets the pass number of the component.
     * @param {number} p - The pass number.
     */
    SetPass(p) {
      this.pass_ = p;
    }

    /**
     * Returns the pass number of the component.
     * @returns {number} The pass number of the component.
     */
    get Pass() {
      return this.pass_;
    }

    /**
     * Initializeializes the component.
     */
    InitializeComponent() {}
    
    /**
     * Initializeializes the entity and all its components.
     */
    InitializeEntity() {}

    /**
     * Returns the component with the given name.
     * @param {string} name - The name of the component to get.
     * @returns {Component} The component with the given name.
     */
    GetComponent(name) {
      return this.entityParent_.GetComponent(name);
    }

    /**
     * Returns the manager of the entity.
     * @returns {CustomEntity} The manager of the entity.
     */
    get Manager() {
      return this.entityParent_.Manager;
    }

    /**
     * Returns the parent entity of the component.
     * @returns {CustomEntity} The parent entity of the component.
     */
    get Parent() {
      return this.entityParent_;
    }

    /**
     * Finds the entity with the given name.
     * @param {string} name - The name of the entity to find.
     * @returns {CustomEntity} The entity with the given name.
     */
    FindEntity(name) {
      return this.entityParent_.FindEntity(name);
    }

    /**
     * Broadcasts an event to all event handlers.
     * @param {object} m - The message to broadcast.
     */
    BroadcastEvent(m) {
      this.entityParent_.BroadcastEvent(m);
    }

    /**
     * Updates the component.
     * @param {number} _ - The time elapsed since the last update.
     */
    Update(_) {}

    /**
     * Adds an event handler for the given event name.
     * @param {string} name - The name of the event to handle.
     * @param {function} h - The event handler function.
     */
    addEventHandler_(name, h) {
      this.entityParent_.addEventHandler_(name, h);
    }
  };

  return {
    CustomEntity: CustomEntity,
    Component: Component,
  };

})();