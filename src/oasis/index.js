/**
 * @title PhysX Joint Basic
 * @category Physics
 */
import dayjs from 'dayjs';
import {
  BlinnPhongMaterial,
  BoxColliderShape,
  Camera,
  DirectLight,
  DynamicCollider,
  FixedJoint,
  MeshRenderer,
  PointerButton,
  PrimitiveMesh,
  Quaternion,
  Ray,
  Script,
  SphereColliderShape,
  Vector3,
  Vector2,
  WebGLEngine,
  Texture2D,
  AssetType,
  RenderFace,
  PBRMaterial,
  PlaneColliderShape,
  StaticCollider,
  TextRenderer,
  Color,
  Font,
} from 'oasis-engine';

import { PhysXPhysics } from '@oasis-engine/physics-physx';
import { createBasket, createPlan, createScoreBasket } from '../models/index';
let curObj = {};
let flag = false;
function createText(rootEntity, pos, fontSize) {
  const entity = rootEntity.createChild('text');
  entity.transform.position = pos;
  const renderer = entity.addComponent(TextRenderer);
  renderer.color = new Color();
  renderer.text = `得分`;
  renderer.font = Font.createFromOS(entity.engine, 'Arial');
  renderer.fontSize = fontSize;
}

function addSphere(rootEntity, radius, position, rotation, velocity) {
  const mtl = new BlinnPhongMaterial(rootEntity.engine);
  mtl.baseColor.set(Math.random(), Math.random(), Math.random(), 1.0);
  const sphereEntity = rootEntity.createChild();
  const renderer = sphereEntity.addComponent(MeshRenderer);

  renderer.mesh = PrimitiveMesh.createSphere(rootEntity.engine, radius);
  renderer.setMaterial(mtl);
  sphereEntity.transform.position = position;
  sphereEntity.transform.rotationQuaternion = rotation;

  const physicsSphere = new SphereColliderShape();
  physicsSphere.radius = radius;
  // 给球设置弹性
  physicsSphere.material.staticFriction = 1; // 静态摩擦 参考 unity api 取值0-1，0弹性接近冰块 1接近橡胶
  physicsSphere.material.dynamicFriction = 1; // 动态摩擦
  physicsSphere.material.bounciness = 1.25; // 球的弹性
  class CollisionScript extends Script {
    onTriggerExit(other) {
      // 防止多次触发 多次计算分数
      if (!flag) {
        curObj.score += 1;
        flag = true;
      }
    }

    onTriggerEnter(other) {
      console.log('接触进入');
    }

    onTriggerStay(other) {}
  }
  const sphereCollider = sphereEntity.addComponent(DynamicCollider);
  sphereEntity.addComponent(CollisionScript);
  sphereCollider.addShape(physicsSphere);
  sphereCollider.linearVelocity = velocity;
  sphereCollider.angularDamping = 0.5;

  return sphereEntity;
}

class ShootScript extends Script {
  ray = new Ray();
  position = new Vector3();
  rotation = new Quaternion();
  camera;
  downTime; // 记录初始按下的时间
  textRenderer;

  onAwake() {
    this.camera = this.entity.getComponent(Camera);
  }

  onUpdate() {
    const { ray } = this;
    const { inputManager } = this.engine;
    if (inputManager.isPointerDown(PointerButton.Primary)) {
      this.downTime = dayjs().valueOf();
    }
    // ray.direction.scale 一定要放在 this.camera.screenPointToRay 后边使用
    if (inputManager.isPointerUp(PointerButton.Primary)) {
      flag = false;
      const upTime = dayjs().valueOf();
      // 记录从按下到抬起的时间
      const diffTime = dayjs(upTime).diff(dayjs(this.downTime), 'milliseconds');
      const secondTime = diffTime / 1000;
      this.camera.screenPointToRay(inputManager.pointerPosition, ray);
      ray.direction.scale(40);
      // console.log(ray.direction);
      // 右偏命中
      // ray.direction.x = 0.26996940998984537;
      // ray.direction.z = -39.93701467422034;
      // ray.direction.y = 2.227549197835684;
      // 正中心 命中
      ray.direction.x = 0.029737613869567837;
      // ray.direction.y = 2.350125311713932;
      ray.direction.z = -39.93089063236084;
      ray.direction.y = -0.5 + diffTime / 1000; // 设置2.18-2.4之间 命中

      if (secondTime > 2 && secondTime <= 3) {
        ray.direction.x = 0.029737613869567837;
        ray.direction.y = 2.18 + (Math.random() * 22) / 100;
        ray.direction.z = -39.93089063236084;
      }
      addSphere(this.entity, 0.4, this.position, this.rotation, ray.direction);
    }
  }
}

function addPlane(rootEntity, size, position, rotation) {
  const mtl = new PBRMaterial(rootEntity.engine);
  mtl.baseColor.set(0, 0.59, 0.41, 1);
  mtl.roughness = 0.0;
  mtl.metallic = 0.0;
  mtl.renderFace = RenderFace.Double;
  const planeEntity = rootEntity.createChild();

  const renderer = planeEntity.addComponent(MeshRenderer);
  renderer.mesh = PrimitiveMesh.createPlane(rootEntity.engine, size.x, size.y);
  renderer.setMaterial(mtl);
  planeEntity.transform.position = position;
  planeEntity.transform.rotationQuaternion = rotation;

  const physicsPlane = new PlaneColliderShape();
  physicsPlane.isTrigger = false; // 是否开启触发器模式
  const planeCollider = planeEntity.addComponent(StaticCollider);
  planeCollider.addShape(physicsPlane);

  return planeEntity;
}
export function init(obj) {
  PhysXPhysics.initialize().then(() => {
    const engine = new WebGLEngine('canvas');
    engine.physicsManager.initialize(PhysXPhysics);
    engine.canvas.resizeByClientSize();
    const scene = engine.sceneManager.activeScene;
    const rootEntity = scene.createRootEntity('root');
    scene.ambientLight.diffuseSolidColor.set(0.5, 0.5, 0.5, 1);
    createPlan(rootEntity, new Vector3(0, 12, 8), engine);
    createBasket(rootEntity, new Vector3(0, 12, 10), engine);
    createScoreBasket(rootEntity, new Vector3(0, 12, 10), engine); // 创建一个虚拟篮筐用于计分
    // createText(rootEntity, new Vector3(-5, 5), 50);
    const cameraEntity = rootEntity.createChild('camera');
    cameraEntity.addComponent(Camera);
    cameraEntity.transform.setPosition(0, 15, 50);
    // cameraEntity.transform.setPosition(0, 1, 32);
    cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
    cameraEntity.addComponent(ShootScript);
    const light = rootEntity.createChild('light');
    light.transform.setPosition(-10, 10, 10);
    light.transform.lookAt(new Vector3());
    light.addComponent(DirectLight);
    addPlane(rootEntity, new Vector2(50, 70), new Vector3(0, -10, 0), new Quaternion());
    curObj = obj;
    engine.run();
  });
}
