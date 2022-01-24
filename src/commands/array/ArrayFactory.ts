import * as THREE from "three";
import c3d from '../../../build/Release/c3d.node';
import { composeMainName, point2point, unit, vec2vec } from "../../util/Conversion";
import { GeometryFactory } from '../../command/GeometryFactory';
import * as visual from "../../visual_model/VisualModel";

export interface ArrayParams {
    isPolar: boolean;
    dir1: THREE.Vector3;
    step1: number;
    num1: number;

    dir2: THREE.Vector3;
    step2: number;
    num2: number;
    degrees: number;

    center: THREE.Vector3;
    isAlongAxis: boolean;
}

export class ArrayFactory extends GeometryFactory implements ArrayParams {
    private model!: c3d.Solid;
    private _solid!: visual.Solid;
    get solid() { return this._solid }
    set solid(solid: visual.Solid) {
        this._solid = solid;
        this.model = this.db.lookup(solid);
    }

    isPolar = true;
    dir1!: THREE.Vector3;
    step1 = 0;
    num1 = 2;

    dir2!: THREE.Vector3;

    private _num2 = 0;
    get num2() { return this._num2 }
    set num2(num2: number) {
        const degrees = this.degrees;
        this._num2 = Math.floor(num2);
        this.degrees = degrees;
    }

    step2 = 0;
    get degrees() { return this.step2 * this.num2 / Math.PI * 180 }
    set degrees(degrees: number) {
        this.step2 = 2 * Math.PI * (degrees / 360) / this.num2;
    }

    center = new THREE.Vector3();
    isAlongAxis = false;

    private names = new c3d.SNameMaker(composeMainName(c3d.CreatorType.DuplicationSolid, this.db.version), c3d.ESides.SideNone, 0);

    async calculate() {
        const { isPolar, dir1, step1, num1, dir2, step2, num2, center, isAlongAxis } = this;
        const params = new c3d.DuplicationMeshValues(isPolar, vec2vec(dir1, 1), unit(step1), num1, vec2vec(dir2, 1), step2, num2, point2point(center), isAlongAxis);

        return c3d.ActionSolid.DuplicationSolid_async(this.model, params, this.names);
    }

    get originalItem() {
        return this.solid;
    }
}
