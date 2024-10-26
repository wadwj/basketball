import { PhysXPhysics } from '@oasis-engine/physics-physx';
import dayjs from 'dayjs';
import {
  Camera,
  DirectLight,
  Vector3,
  WebGLEngine,
  Script,
  Ray,
  Quaternion,
  PointerButton,
  Entity,
  BlinnPhongMaterial,
  MeshRenderer,
  PrimitiveMesh,
  DynamicCollider,
  SphereColliderShape,
  StaticCollider,
  BoxColliderShape,
} from 'oasis-engine';

function addSphere(
  rootEntity: Entity,
  radius: number,
  position: Vector3,
  rotation: Quaternion,
  velocity: Vector3,
): Entity {
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
  const sphereCollider = sphereEntity.addComponent(DynamicCollider);
  sphereCollider.addShape(physicsSphere);
  sphereCollider.linearVelocity = velocity;
  sphereCollider.angularDamping = 0.5;

  return sphereEntity;
}

export function createPlan(rootEntity: Entity, position: Vector3, engine: WebGLEngine) {
  const entity = rootEntity.createChild('plane');
  entity.transform.setPosition(position.x, position.y, position.z);
  entity.transform.rotate(0, 0, 0);
  const render = entity.addComponent(MeshRenderer);
  render.mesh = PrimitiveMesh.createCuboid(engine, 8, 5, 1);
  const material = new BlinnPhongMaterial(engine);
  material.baseColor.set(1, 1, 1, 0);
  material.isTransparent = false;
  render.setMaterial(material);

  const physicsPlane = new BoxColliderShape();
  physicsPlane.size = new Vector3(8, 5, 1);
  // physicsPlane.setPosition(position.x, position.y, position.z);
  const planeCollider = entity.addComponent(StaticCollider);
  planeCollider.addShape(physicsPlane);
  return entity;
}

export function createBasket(rootEntity: Entity, position: Vector3, engine: WebGLEngine) {
  const entity = rootEntity.createChild('basket');
  entity.transform.setPosition(position.x, position.y, position.z);
  entity.transform.rotate(90, 0, 0);
  const render = entity.addComponent(MeshRenderer);
  render.mesh = PrimitiveMesh.createTorus(engine, 1);
  const material = new BlinnPhongMaterial(engine);
  render.setMaterial(material);

  for (let i = 0; i < 3; i++) {
    const boxEntity = rootEntity.createChild(`fence${i}`);
    const curPosition = new Vector3(
      position.x + (i - 1),
      position.y,
      i === 1 ? position.z + 1 : position.z,
    );
    boxEntity.transform.setPosition(curPosition.x, curPosition.y, curPosition.z);
    boxEntity.transform.rotate(0, 90 * (i - 1), 0);
    const planRender = boxEntity.addComponent(MeshRenderer);
    planRender.mesh = PrimitiveMesh.createCuboid(engine, 2, 0.1, 0.4);
    // 展示边框可以打开
    // const planMaterial = new BlinnPhongMaterial(engine);
    // planRender.setMaterial(planMaterial);

    const physicsBox = new BoxColliderShape();
    physicsBox.size = new Vector3(2, 0.1, 0.4);
    const boxCollider = boxEntity.addComponent(StaticCollider);
    boxCollider.addShape(physicsBox);
  }
}

export function createScoreBasket(rootEntity: Entity, position: Vector3, engine: WebGLEngine) {
  const entity = rootEntity.createChild('scoreBasket');
  entity.transform.setPosition(position.x, position.y, position.z);
  entity.transform.rotate(90, 0, 0);
  const render = entity.addComponent(MeshRenderer);
  render.mesh = PrimitiveMesh.createTorus(engine, 0.5);
  const material = new BlinnPhongMaterial(engine);
  material.baseColor.set(1, 1, 1, 0);
  material.isTransparent = false;
  render.setMaterial(material);

  for (let i = 0; i < 3; i++) {
    const boxEntity = rootEntity.createChild(`fence${i}`);
    const curPosition = new Vector3(
      position.x + (i - 1) / 2,
      position.y,
      i === 1 ? position.z + 0.3 : position.z,
    );
    boxEntity.transform.setPosition(curPosition.x, curPosition.y, curPosition.z);
    boxEntity.transform.rotate(0, 90 * (i - 1), 0);
    const planRender = boxEntity.addComponent(MeshRenderer);
    planRender.mesh = PrimitiveMesh.createCuboid(engine, 0.5, 0.1, 0.4);
    // 展示边框可以打开
    // const planMaterial = new BlinnPhongMaterial(engine);
    // planRender.setMaterial(planMaterial);

    const physicsBox = new BoxColliderShape();
    physicsBox.size = new Vector3(0.5, 0.1, 0.4);
    physicsBox.isTrigger = true;
    const boxCollider = boxEntity.addComponent(StaticCollider);
    boxCollider.addShape(physicsBox);
  }
}

class ShootScript extends Script {
  ray = new Ray();
  position = new Vector3();
  rotation = new Quaternion();
  camera!: Camera;
  downTime: any;

  onAwake() {
    this.camera = this.entity.getComponent(Camera);
  }

  onUpdate() {
    const { ray } = this;
    const { inputManager } = this.engine;
    if (inputManager.isPointerDown(PointerButton.Primary)) {
      this.downTime = dayjs().valueOf();
    }
    if (inputManager.isPointerUp(PointerButton.Primary)) {
      const upTime = dayjs().valueOf();
      // 记录从按下到抬起的时间
      const diffTime = dayjs(upTime).diff(dayjs(this.downTime), 'second');
      this.camera.screenPointToRay(inputManager.pointerPosition, ray);
      ray.direction.scale(50);
      // x 球打到的屏幕横向位置, y 抛物线打到篮板的高度, z 力度, 以当前模拟篮板例子，z可以取值-9 - -29， 高度不变 超过 -29然后增加高度
      ray.direction.x = 0.05211014634274693;
      ray.direction.y = 3.422707504228472;

      if (diffTime <= 0) {
        ray.direction.z = -9.585745056898915;
      } else if (diffTime > 0 && diffTime <= 2) {
        ray.direction.z = -10.585745056898915;
      } else {
        ray.direction.y = 4.422707504228472 + diffTime;
        ray.direction.z = -29.585745056898915;
      }
      addSphere(this.entity, 0.5, this.position, this.rotation, ray.direction);
    }
  }
}

export function init() {
  PhysXPhysics.initialize().then(() => {
    const engine = new WebGLEngine('canvas');
    engine.physicsManager.initialize(PhysXPhysics);

    engine.canvas.resizeByClientSize();
    const scene = engine.sceneManager.activeScene;
    const rootEntity = scene.createRootEntity('root');

    scene.ambientLight.diffuseSolidColor.set(0.5, 0.5, 0.5, 1);

    createPlan(rootEntity, new Vector3(0, 0, 0), engine);
    createBasket(rootEntity, new Vector3(0, 0, 2.5), engine);

    // init camera
    const cameraEntity = rootEntity.createChild('camera');
    cameraEntity.addComponent(Camera);
    cameraEntity.transform.setPosition(0, 10, 22);
    cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
    cameraEntity.addComponent(ShootScript);

    // init direct light
    const light = rootEntity.createChild('light');
    light.transform.setPosition(-10, 10, 10);
    light.transform.lookAt(new Vector3());
    light.addComponent(DirectLight);

    // Run engine
    engine.run();
  });
}
