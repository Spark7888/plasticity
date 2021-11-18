import * as THREE from "three";
import c3d from '../../../build/Release/c3d.node';
import { PlaneSnap } from "../../editor/snaps/Snap";
import { composeMainName, point2point } from "../../util/Conversion";
import { BooleanFactory, PossiblyBooleanFactory } from "../boolean/BooleanFactory";
import { GeometryFactory, ValidationError } from '../GeometryFactory';
import { CenterRectangleFactory, DiagonalRectangleFactory, ThreePointRectangleFactory } from "../rect/RectangleFactory";
import * as visual from '../../visual_model/VisualModel';

type FourCorners = { p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3 }

interface BoxParams {
    p1: THREE.Vector3;
    p2: THREE.Vector3;
    p3: THREE.Vector3;
}

abstract class BoxFactory extends GeometryFactory implements BoxParams {
    p1!: THREE.Vector3;
    p2!: THREE.Vector3;
    p3!: THREE.Vector3;

    private names = new c3d.SNameMaker(composeMainName(c3d.CreatorType.ElementarySolid, this.db.version), c3d.ESides.SideNone, 0);

    async calculate() {
        const { p1, p2, p3, p4 } = this.orthogonal();

        const points = [point2point(p1), point2point(p2), point2point(p3), point2point(p4),]
        return c3d.ActionSolid.ElementarySolid(points, c3d.ElementaryShellType.Block, this.names);
    }

    private static readonly AB = new THREE.Vector3();
    private static readonly BC = new THREE.Vector3();
    private static readonly _heightNormal = new THREE.Vector3();

    static heightNormal(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
        const { AB, BC, _heightNormal } = this;
        AB.copy(p2).sub(p1)
        BC.copy(p3).sub(p2);
        return _heightNormal.copy(AB).cross(BC).normalize();
    }

    protected abstract orthogonal(): FourCorners;
}

export class ThreePointBoxFactory extends BoxFactory {
    p4!: THREE.Vector3;

    private static readonly height = new THREE.Vector3();

    static reorientHeight(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, upper: THREE.Vector3): FourCorners {
        const { height } = this;

        const heightNormal = this.heightNormal(p1, p2, p3);
        const h = height.copy(upper).sub(p3).dot(heightNormal);

        if (Math.abs(h) < 10e-5) throw new ValidationError("invalid height");

        const p4 = heightNormal.multiplyScalar(h).add(p3);
        if (h < 0) return { p1: p2, p2: p1, p3, p4 }
        else return { p1, p2, p3, p4 }
    }

    protected orthogonal() {
        const { p1, p2, p3 } = ThreePointRectangleFactory.orthogonal(this.p1, this.p2, this.p3);
        return ThreePointBoxFactory.reorientHeight(p1, p2, p3, this.p4);
    }
}

interface DiagonalBoxParams extends BoxParams {
    constructionPlane: PlaneSnap;
    get heightNormal(): THREE.Vector3;
}

abstract class DiagonalBoxFactory extends BoxFactory implements DiagonalBoxParams {
    constructionPlane = new PlaneSnap();

    protected orthogonal() {
        const { corner1, p2: corner2, p3: upper, constructionPlane } = this;
        const { p1, p2, p3 } = DiagonalRectangleFactory.orthogonal(corner1, corner2, constructionPlane.n);

        return ThreePointBoxFactory.reorientHeight(p1, p2, p3, upper);
    }

    abstract get corner1(): THREE.Vector3;

    get heightNormal() {
        const { corner1, p2: corner2, constructionPlane } = this;
        const { p1, p2, p3 } = DiagonalRectangleFactory.orthogonal(corner1, corner2, constructionPlane.n);

        return BoxFactory.heightNormal(p1, p2, p3);
    }
}

export class CornerBoxFactory extends DiagonalBoxFactory {
    get corner1() { return this.p1 }
}

export class CenterBoxFactory extends DiagonalBoxFactory {
    get corner1() {
        return CenterRectangleFactory.corner1(this.p1, this.p2);
    }
}

abstract class PossiblyBooleanBoxFactory<B extends BoxFactory> extends PossiblyBooleanFactory<B> implements BoxParams {
    protected bool = new BooleanFactory(this.db, this.materials, this.signals);
    protected abstract fantom: B;

    get solid() { return this._solid }
    set solid(solid: visual.Solid | undefined) {
        super.solid = solid;
        if (solid !== undefined) this.bool.solid = solid;
    }

    get p1() { return this.fantom.p1 }
    get p2() { return this.fantom.p2 }
    get p3() { return this.fantom.p3 }

    set p1(p1: THREE.Vector3) { this.fantom.p1 = p1 }
    set p2(p2: THREE.Vector3) { this.fantom.p2 = p2 }
    set p3(p3: THREE.Vector3) { this.fantom.p3 = p3 }

    protected async precomputeGeometry() {
        await super.precomputeGeometry();
        if (this._phantom !== undefined) this.bool.toolModels = [this._phantom];
    }
}

export class PossiblyBooleanThreePointBoxFactory extends PossiblyBooleanBoxFactory<ThreePointBoxFactory> {
    protected fantom = new ThreePointBoxFactory(this.db, this.materials, this.signals);

    get p4() { return this.fantom.p4 }
    set p4(p4: THREE.Vector3) { this.fantom.p4 = p4 }
}

abstract class PossiblyBooleanDiagonalBoxFactory extends PossiblyBooleanBoxFactory<DiagonalBoxFactory> implements DiagonalBoxParams {
    get constructionPlane() { return this.fantom.constructionPlane }
    get heightNormal() { return this.fantom.heightNormal }

    set constructionPlane(constructionPlane: PlaneSnap) { this.fantom.constructionPlane = constructionPlane }
}

export class PossiblyBooleanCenterBoxFactory extends PossiblyBooleanDiagonalBoxFactory implements DiagonalBoxParams {
    protected fantom = new CenterBoxFactory(this.db, this.materials, this.signals);
}

export class PossiblyBooleanCornerBoxFactory extends PossiblyBooleanDiagonalBoxFactory implements DiagonalBoxParams {
    protected fantom = new CornerBoxFactory(this.db, this.materials, this.signals);
}