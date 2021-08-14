import * as THREE from "three";
import c3d from '../../build/Release/c3d.node';
import { AxisSnap } from "../editor/SnapManager";
import * as visual from "../editor/VisualModel";
import { Finish } from "../util/Cancellable";
import { cart2vec, vec2vec } from "../util/Conversion";
import { mode } from "./AbstractGizmo";
import { CenterPointArcFactory, ThreePointArcFactory } from "./arc/ArcFactory";
import { CutFactory, DifferenceFactory, IntersectionFactory, UnionFactory } from './boolean/BooleanFactory';
import { CenterBoxFactory, CornerBoxFactory, ThreePointBoxFactory } from './box/BoxFactory';
import { CharacterCurveDialog } from "./character-curve/CharacterCurveDialog";
import CharacterCurveFactory from "./character-curve/CharacterCurveFactory";
import { CenterCircleFactory, ThreePointCircleFactory, TwoPointCircleFactory } from './circle/CircleFactory';
import { CircleKeyboardGizmo } from "./circle/CircleKeyboardGizmo";
import Command from "./Command";
import { ChangePointFactory, RemovePointFactory } from "./control_point/ControlPointFactory";
import { JointOrPolylineOrContourFilletFactory } from "./curve/ContourFilletFactory";
import { CurveWithPreviewFactory } from "./curve/CurveFactory";
import { CurveKeyboardEvent, CurveKeyboardGizmo, LineKeyboardGizmo } from "./curve/CurveKeyboardGizmo";
import JoinCurvesFactory from "./curve/JoinCurvesFactory";
import OffsetContourFactory from "./curve/OffsetContourFactory";
import TrimFactory from "./curve/TrimFactory";
import CylinderFactory from './cylinder/CylinderFactory';
import { CenterEllipseFactory, ThreePointEllipseFactory } from "./ellipse/EllipseFactory";
import ExtrudeFactory, { RegionExtrudeFactory } from "./extrude/ExtrudeFactory";
import { ExtrudeGizmo } from "./extrude/ExtrudeGizmo";
import ChamferFactory from "./fillet/ChamferFactory";
import { ChamferGizmo } from "./fillet/ChamferGizmo";
import { FilletDialog } from "./fillet/FilletDialog";
import FilletFactory, { Max } from './fillet/FilletFactory';
import { FilletGizmo } from './fillet/FilletGizmo';
import { FilletKeyboardGizmo } from "./fillet/FilletKeyboardGizmo";
import { ValidationError } from "./GeometryFactory";
import LineFactory from './line/LineFactory';
import LoftFactory from "./loft/LoftFactory";
import { DistanceGizmo, LengthGizmo, MagnitudeGizmo } from "./MiniGizmos";
import MirrorFactory from "./mirror/MirrorFactory";
import { DraftSolidFactory } from "./modifyface/DraftSolidFactory";
import { ActionFaceFactory, CreateFaceFactory, FilletFaceFactory, PurifyFaceFactory, RemoveFaceFactory } from "./modifyface/ModifyFaceFactory";
import { OffsetFaceFactory } from "./modifyface/OffsetFaceFactory";
import { OffsetFaceGizmo } from "./modifyface/OffsetFaceGizmo";
import { ObjectPicker } from "./ObjectPicker";
import { PointPicker } from './PointPicker';
import { PolygonFactory } from "./polygon/PolygonFactory";
import { PolygonKeyboardGizmo } from "./polygon/PolygonKeyboardGizmo";
import { CenterRectangleFactory, CornerRectangleFactory, ThreePointRectangleFactory } from './rect/RectangleFactory';
import { RegionFactory } from "./region/RegionFactory";
import SphereFactory from './sphere/SphereFactory';
import { SpiralFactory } from "./spiral/SpiralFactory";
import { SpiralGizmo } from "./spiral/SpiralGizmo";
import { MoveGizmo } from './translate/MoveGizmo';
import { RotateGizmo } from './translate/RotateGizmo';
import { ScaleGizmo } from "./translate/ScaleGizmo";
import { MoveFactory, RotateFactory, ScaleFactory } from './translate/TranslateFactory';

export class SphereCommand extends Command {
    async execute(): Promise<void> {
        const sphere = new SphereFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        const pointPicker = new PointPicker(this.editor);

        const { point: p1 } = await pointPicker.execute().resource(this);
        sphere.center = p1;

        await pointPicker.execute(({ point: p2 }) => {
            const radius = p1.distanceTo(p2);
            sphere.radius = radius;
            sphere.update();
        }).resource(this);
        await sphere.commit();
    }
}

export class CenterCircleCommand extends Command {
    async execute(): Promise<void> {
        const circle = new CenterCircleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const keyboard = new CircleKeyboardGizmo(this.editor);
        keyboard.execute(e => {
            switch (e) {
                case 'mode':
                    circle.toggleMode();
                    circle.update();
                    break;
            }
        }).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point } = await pointPicker.execute().resource(this);
        circle.center = point;

        pointPicker.restrictToPlaneThroughPoint(point);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        await pointPicker.execute(({ point: p2, info: { constructionPlane } }) => {
            circle.point = p2;
            circle.constructionPlane = constructionPlane;
            circle.update();
        }).resource(this);

        const result = await circle.commit() as visual.SpaceInstance<visual.Curve3D>;
    }
}

export class TwoPointCircleCommand extends Command {
    async execute(): Promise<void> {
        const circle = new TwoPointCircleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const keyboard = new CircleKeyboardGizmo(this.editor);
        keyboard.execute(e => {
            switch (e) {
                case 'mode':
                    circle.toggleMode();
                    circle.update();
                    break;
            }
        }).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point } = await pointPicker.execute().resource(this);
        circle.p1 = point;

        pointPicker.restrictToPlaneThroughPoint(point);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        await pointPicker.execute(({ point: p2, info: { constructionPlane } }) => {
            circle.p2 = p2;
            circle.constructionPlane = constructionPlane;
            circle.update();
        }).resource(this);

        const result = await circle.commit() as visual.SpaceInstance<visual.Curve3D>;
    }
}

export class ThreePointCircleCommand extends Command {
    async execute(): Promise<void> {
        const circle = new ThreePointCircleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point: p1 } = await pointPicker.execute().resource(this);
        circle.p1 = p1;

        const { point: p2 } = await pointPicker.execute().resource(this);
        circle.p2 = p2;

        await pointPicker.execute(({ point: p3 }) => {
            circle.p3 = p3;
            circle.update();
        }).resource(this);

        const result = await circle.commit() as visual.SpaceInstance<visual.Curve3D>;
    }
}

export class CenterPointArcCommand extends Command {
    async execute(): Promise<void> {
        const arc = new CenterPointArcFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point } = await pointPicker.execute().resource(this);
        arc.center = point;

        pointPicker.restrictToPlaneThroughPoint(point);
        pointPicker.straightSnaps.delete(AxisSnap.Z);

        const line = new LineFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        line.p1 = point;
        const { point: p2 } = await pointPicker.execute(({ point }) => {
            line.p2 = point;
            line.update();
        }).resource(this);
        line.cancel();
        arc.p2 = p2;

        await pointPicker.execute(({ point: p3, info: { constructionPlane } }) => {
            arc.p3 = p3;
            arc.constructionPlane = constructionPlane;
            arc.update();
        }).resource(this);

        const result = await arc.commit() as visual.SpaceInstance<visual.Curve3D>;
    }
}

export class CenterEllipseCommand extends Command {
    async execute(): Promise<void> {
        const ellipse = new CenterEllipseFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point } = await pointPicker.execute().resource(this);
        ellipse.center = point;

        pointPicker.restrictToPlaneThroughPoint(point);
        pointPicker.straightSnaps.delete(AxisSnap.Z);

        const line = new LineFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        line.p1 = point;
        const { point: p2 } = await pointPicker.execute(({ point }) => {
            line.p2 = point;
            line.update();
        }).resource(this);
        line.cancel();
        ellipse.p2 = p2;

        await pointPicker.execute(({ point }) => {
            ellipse.p3 = point;
            ellipse.update();
        }).resource(this);

        const result = await ellipse.commit() as visual.SpaceInstance<visual.Curve3D>;
    }
}

export class ThreePointEllipseCommand extends Command {
    async execute(): Promise<void> {
        const ellipse = new ThreePointEllipseFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point } = await pointPicker.execute().resource(this);
        ellipse.p1 = point;

        const line = new LineFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        line.p1 = point;
        const { point: p2 } = await pointPicker.execute(({ point }) => {
            line.p2 = point;
            line.update();
        }).resource(this);
        line.cancel();
        ellipse.p2 = p2;

        await pointPicker.execute(({ point: p3 }) => {
            ellipse.p3 = p3;
            ellipse.update();
        }).resource(this);

        const result = await ellipse.commit() as visual.SpaceInstance<visual.Curve3D>;
    }
}

export class ThreePointArcCommand extends Command {
    async execute(): Promise<void> {
        const arc = new ThreePointArcFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point } = await pointPicker.execute().resource(this);
        arc.p1 = point;

        const line = new LineFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        line.p1 = point;
        const { point: p2 } = await pointPicker.execute(({ point }) => {
            line.p2 = point;
            line.update();
        }).resource(this);
        line.cancel();
        arc.p2 = p2;

        await pointPicker.execute(({ point: p3 }) => {
            arc.p3 = p3;
            arc.update();
        }).resource(this);

        const result = await arc.commit() as visual.SpaceInstance<visual.Curve3D>;
    }
}

export class PolygonCommand extends Command {
    async execute(): Promise<void> {
        const polygon = new PolygonFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const keyboard = new PolygonKeyboardGizmo(this.editor);
        keyboard.execute(e => {
            switch (e) {
                case 'add-vertex':
                    polygon.vertexCount++;
                    break;
                case 'subtract-vertex':
                    polygon.vertexCount--;
                    break;
            }
            polygon.update();
        }).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point } = await pointPicker.execute().resource(this);
        polygon.center = point;

        pointPicker.restrictToPlaneThroughPoint(point);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        await pointPicker.execute(({ point, info: { constructionPlane } }) => {
            polygon.constructionPlane = constructionPlane;
            polygon.p2 = point;
            polygon.update();
        }).resource(this);

        await polygon.commit();
    }
}

export class SpiralCommand extends Command {
    async execute(): Promise<void> {
        const spiral = new SpiralFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const pointPicker = new PointPicker(this.editor);
        const { point: p1 } = await pointPicker.execute().resource(this);
        spiral.p1 = p1;

        const line = new LineFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        line.p1 = p1;
        const { point: p2 } = await pointPicker.execute(({ point }) => {
            line.p2 = point;
            line.update();
        }).resource(this);
        line.cancel();
        spiral.p2 = p2;

        pointPicker.straightSnaps.delete(AxisSnap.Z);
        pointPicker.restrictToPlaneThroughPoint(p2);

        await pointPicker.execute(({ point }) => {
            spiral.radius = point.distanceTo(p2);
            spiral.p3 = point;
            spiral.update();
        }).resource(this);

        const spiralGizmo = new SpiralGizmo(spiral, this.editor);
        spiralGizmo.execute(params => {
            spiral.update();
        }, mode.Persistent).resource(this);

        await this.finished;

        await spiral.commit();
    }
}

export class RegionCommand extends Command {
    async execute(): Promise<void> {
        const region = new RegionFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        region.contours = [...this.editor.selection.selected.curves];
        await region.commit();
    }
}

export class CylinderCommand extends Command {
    async execute(): Promise<void> {
        let pointPicker = new PointPicker(this.editor);

        const circle = new CenterCircleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        const { point: p1 } = await pointPicker.execute().resource(this);
        circle.center = p1;

        pointPicker.restrictToPlaneThroughPoint(p1);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        const { point: p2 } = await pointPicker.execute(({ point: p2, info: { constructionPlane } }) => {
            circle.point = p2;
            circle.constructionPlane = constructionPlane;
            circle.update();
        }).resource(this);
        circle.cancel();

        const cylinder = new CylinderFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        cylinder.base = p1;
        cylinder.radius = p2;
        pointPicker = new PointPicker(this.editor);
        pointPicker.addPlacement(p1);
        await pointPicker.execute(({ point: p3 }) => {
            cylinder.height = p3;
            cylinder.update();
        }).resource(this);

        await cylinder.commit();
    }
}

export class CurveCommand extends Command {
    protected type = c3d.SpaceType.Hermit3D;
    protected get keyboard() { return new CurveKeyboardGizmo(this.editor) };

    async execute(): Promise<void> {
        this.editor.layers.showControlPoints();
        this.ensure(() => this.editor.layers.hideControlPoints());

        const makeCurve = new CurveWithPreviewFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        makeCurve.type = this.type;

        const pointPicker = new PointPicker(this.editor);
        const keyboard = this.keyboard;
        keyboard.execute((e: CurveKeyboardEvent) => {
            switch (e.tag) {
                case 'type':
                    makeCurve.type = e.type;
                    makeCurve.update();
                    break;
                case 'undo':
                    pointPicker.undo();
                    makeCurve.undo();
                    makeCurve.update();
                    break;
            }
        }).resource(this);

        while (true) {
            if (makeCurve.canBeClosed) pointPicker.addPointSnap(makeCurve.startPoint);
            try {
                const { point } = await pointPicker.execute(async ({ point }) => {
                    makeCurve.preview.last = point;
                    makeCurve.preview.closed = makeCurve.preview.wouldBeClosed(point);
                    if (!makeCurve.preview.hasEnoughPoints) return;
                    await makeCurve.preview.update();
                }, 'RejectOnFinish').resource(this);
                if (makeCurve.wouldBeClosed(point)) {
                    makeCurve.closed = true;
                    throw Finish;
                }
                makeCurve.push(point);
                makeCurve.update();
            } catch (e) {
                if (e !== Finish) throw e;
                break;
            }
        }

        makeCurve.preview.cancel();
        await makeCurve.commit();
    }
}

export class LineCommand extends CurveCommand {
    protected type = c3d.SpaceType.Polyline3D;
    protected get keyboard() { return new LineKeyboardGizmo(this.editor) };
}

export class JoinCurvesCommand extends Command {
    async execute(): Promise<void> {
        const contour = new JoinCurvesFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        for (const curve of this.editor.selection.selected.curves) contour.push(curve);
        await contour.commit();
    }
}

export class ThreePointRectangleCommand extends Command {
    async execute(): Promise<void> {
        const pointPicker = new PointPicker(this.editor);

        const line = new LineFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        const { point: p1 } = await pointPicker.execute().resource(this);
        line.p1 = p1;
        const { point: p2 } = await pointPicker.execute(({ point: p2 }) => {
            line.p2 = p2;
            line.update();
        }).resource(this);
        line.cancel();

        const rect = new ThreePointRectangleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        rect.p1 = p1;
        rect.p2 = p2;
        await pointPicker.execute(({ point: p3 }) => {
            rect.p3 = p3;
            rect.update();
        }).resource(this);

        await rect.commit();
    }
}

export class CornerRectangleCommand extends Command {
    async execute(): Promise<void> {
        const pointPicker = new PointPicker(this.editor);
        const { point: p1 } = await pointPicker.execute().resource(this);
        pointPicker.restrictToPlaneThroughPoint(p1);
        pointPicker.straightSnaps.delete(AxisSnap.X);
        pointPicker.straightSnaps.delete(AxisSnap.Y);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, 1, 0)));
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, -1, 0)));

        const rect = new CornerRectangleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        rect.p1 = p1;
        await pointPicker.execute(({ point: p2, info: { constructionPlane } }) => {
            rect.p2 = p2;
            rect.constructionPlane = constructionPlane;
            rect.update();
        }).resource(this);

        await rect.commit();
    }
}

export class CenterRectangleCommand extends Command {
    async execute(): Promise<void> {
        const pointPicker = new PointPicker(this.editor);
        const { point: p1 } = await pointPicker.execute().resource(this);
        pointPicker.restrictToPlaneThroughPoint(p1);
        pointPicker.straightSnaps.delete(AxisSnap.X);
        pointPicker.straightSnaps.delete(AxisSnap.Y);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, 1, 0)));
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, -1, 0)));

        const rect = new CenterRectangleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        rect.p1 = p1;
        await pointPicker.execute(({ point: p2, info: { constructionPlane } }) => {
            rect.p2 = p2;
            rect.constructionPlane = constructionPlane;
            rect.update();
        }).resource(this);

        await rect.commit();
    }
}

export class ThreePointBoxCommand extends Command {
    async execute(): Promise<void> {
        const pointPicker = new PointPicker(this.editor);

        const line = new LineFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        const { point: p1 } = await pointPicker.execute().resource(this);
        line.p1 = p1;
        const { point: p2 } = await pointPicker.execute(({ point: p2 }) => {
            line.p2 = p2;
            line.update();
        }).resource(this);
        line.cancel();

        const rect = new ThreePointRectangleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        rect.p1 = p1;
        rect.p2 = p2;
        const { point: p3 } = await pointPicker.execute(({ point: p3 }) => {
            rect.p3 = p3;
            rect.update();
        }).resource(this);
        rect.cancel();

        const box = new ThreePointBoxFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        box.p1 = p1;
        box.p2 = p2;
        box.p3 = p3;
        await pointPicker.execute(({ point: p4 }) => {
            box.p4 = p4;
            box.update();
        }).resource(this);
        await box.commit();
    }
}

export class CornerBoxCommand extends Command {
    async execute(): Promise<void> {
        let pointPicker = new PointPicker(this.editor);
        const { point: p1 } = await pointPicker.execute().resource(this);

        pointPicker.restrictToPlaneThroughPoint(p1);
        pointPicker.straightSnaps.delete(AxisSnap.X);
        pointPicker.straightSnaps.delete(AxisSnap.Y);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, 1, 0)));
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, -1, 0)));

        const rect = new CornerRectangleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        rect.p1 = p1;
        const { point: p2 } = await pointPicker.execute(({ point: p2, info: { constructionPlane } }) => {
            rect.p2 = p2;
            rect.constructionPlane = constructionPlane;
            rect.update();
        }).resource(this);
        rect.cancel();

        const box = new CornerBoxFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        box.p1 = p1;
        box.p2 = p2;

        pointPicker = new PointPicker(this.editor);
        pointPicker.restrictToLine(p2, box.heightNormal);

        await pointPicker.execute(({ point: p3 }) => {
            box.p3 = p3;
            box.update();
        }).resource(this);
        await box.commit();
    }
}

export class CenterBoxCommand extends Command {
    async execute(): Promise<void> {
        let pointPicker = new PointPicker(this.editor);
        const { point: p1 } = await pointPicker.execute().resource(this);
        pointPicker.restrictToPlaneThroughPoint(p1);
        pointPicker.straightSnaps.delete(AxisSnap.X);
        pointPicker.straightSnaps.delete(AxisSnap.Y);
        pointPicker.straightSnaps.delete(AxisSnap.Z);
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, 1, 0)));
        pointPicker.straightSnaps.add(new AxisSnap(new THREE.Vector3(1, -1, 0)));

        const rect = new CenterRectangleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        rect.p1 = p1;
        const { point: p2 } = await pointPicker.execute(({ point: p2, info: { constructionPlane } }) => {
            rect.p2 = p2;
            rect.constructionPlane = constructionPlane;
            rect.update();
        }).resource(this);
        rect.cancel();

        const box = new CenterBoxFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        box.p1 = p1;
        box.p2 = p2;

        pointPicker = new PointPicker(this.editor);
        pointPicker.restrictToLine(p2, box.heightNormal);

        await pointPicker.execute(({ point: p3 }) => {
            box.p3 = p3;
            box.update();
        }).resource(this);
        await box.commit();
    }
}

export class MoveCommand extends Command {
    async execute(): Promise<void> {
        const objects = [...this.editor.selection.selected.solids, ...this.editor.selection.selected.curves];

        const bbox = new THREE.Box3();
        for (const object of objects) bbox.expandByObject(object);
        const centroid = new THREE.Vector3();
        bbox.getCenter(centroid);

        const move = new MoveFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        move.pivot = centroid;
        move.items = objects;

        const gizmo = new MoveGizmo(move, this.editor);
        gizmo.position.copy(centroid);
        await gizmo.execute(s => {
            move.update();
        }).resource(this);
        
        const selection = await move.commit();
        this.editor.selection.selected.add(selection);

    }
}

export class ScaleCommand extends Command {
    async execute(): Promise<void> {
        const objects = [...this.editor.selection.selected.solids, ...this.editor.selection.selected.curves];

        const bbox = new THREE.Box3();
        for (const object of objects) bbox.expandByObject(object);
        const centroid = new THREE.Vector3();
        bbox.getCenter(centroid);

        const scale = new ScaleFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        scale.items = objects;
        scale.pivot = centroid;

        const gizmo = new ScaleGizmo(scale, this.editor);
        gizmo.position.copy(centroid);
        await gizmo.execute(s => {
            scale.update();
        }).resource(this);

        const selection = await scale.commit();
        this.editor.selection.selected.add(selection);
    }
}

export class RotateCommand extends Command {
    async execute(): Promise<void> {
        const objects = [...this.editor.selection.selected.solids, ...this.editor.selection.selected.curves];

        if (objects.length === 0) throw new ValidationError("Select something first");

        const bbox = new THREE.Box3();
        for (const object of objects) bbox.expandByObject(object);
        const centroid = new THREE.Vector3();
        bbox.getCenter(centroid);

        const rotate = new RotateFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        rotate.items = objects;
        rotate.pivot = centroid;

        const gizmo = new RotateGizmo(rotate, this.editor);
        gizmo.position.copy(centroid);
        await gizmo.execute(params => {
            rotate.update();
        }).resource(this);

        const selection = await rotate.commit();
        this.editor.selection.selected.add(selection);
    }
}

export class UnionCommand extends Command {
    async execute(): Promise<void> {
        const items = [...this.editor.selection.selected.solids];
        const object1 = items[0]!;
        const object2 = items[1]!;

        const union = new UnionFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        union.item1 = object1;
        union.item2 = object2;
        await union.commit();
    }
}

export class IntersectionCommand extends Command {
    async execute(): Promise<void> {
        const items = [...this.editor.selection.selected.solids];
        const object1 = items[0]!;
        const object2 = items[1]!;

        const intersection = new IntersectionFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        intersection.item1 = object1;
        intersection.item2 = object2;
        await intersection.commit();
    }
}

export class DifferenceCommand extends Command {
    async execute(): Promise<void> {
        const items = [...this.editor.selection.selected.solids];
        const object1 = items[0]!;
        const object2 = items[1]!;

        const difference = new DifferenceFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        difference.item1 = object1;
        difference.item2 = object2;
        await difference.commit();
    }
}

export class CutCommand extends Command {
    async execute(): Promise<void> {
        const cut = new CutFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        cut.constructionPlane = this.editor.activeViewport?.constructionPlane;
        cut.solid = this.editor.selection.selected.solids.first;
        cut.curve = this.editor.selection.selected.curves.first;
        await cut.commit();
    }
}

export class FilletCommand extends Command {
    point?: THREE.Vector3

    async execute(): Promise<void> {
        const edges = [...this.editor.selection.selected.edges];
        const edge = edges[edges.length - 1];
        const item = edge.parentItem as visual.Solid;

        const fillet = new FilletFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        fillet.item = item;
        fillet.edges = edges;

        const mainGizmo = new FilletGizmo(fillet, this.editor, this.point);
        mainGizmo.showEdges();

        const filletDialog = new FilletDialog(fillet, this.editor.signals);
        const dialog = filletDialog.execute(async params => {
            mainGizmo.render(params.distance1);
            await fillet.update();
        }).resource(this);

        const max = new Max(fillet);
        max.start();

        const keyboard = new FilletKeyboardGizmo(this.editor);
        const pp = new PointPicker(this.editor);
        const restriction = pp.restrictToEdges(edges);
        keyboard.execute(async s => {
            switch (s) {
                case 'add':
                    const { point } = await pp.execute().resource(this);
                    const { view, t } = restriction.match;
                    const fn = fillet.functions.get(view.simpleName)!;
                    const gizmo = mainGizmo.addVariable(point, restriction.match);
                    gizmo.execute(async delta => {
                        fn.InsertValue(t, delta);
                        fillet.update();
                    }, mode.Persistent).resource(this);
                    break;
            }
        }).resource(this);

        mainGizmo.execute(async params => {
            filletDialog.render();
            await max.exec(params.distance1);
        }, mode.Persistent).resource(this);

        // Dialog OK/Cancel buttons trigger completion of the entire command.
        dialog.then(() => this.finish(), () => this.cancel());

        await this.finished;

        const selection = await fillet.commit() as visual.Solid;
        this.editor.selection.selected.addSolid(selection);
    }
}

export class ChamferCommand extends Command {
    async execute(): Promise<void> {
        const edges = [...this.editor.selection.selected.edges];
        const edge = edges[edges.length - 1];
        const item = edge.parentItem as visual.Solid;

        const chamfer = new ChamferFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        chamfer.item = item;
        chamfer.edges = edges;

        const gizmo = new ChamferGizmo(chamfer, this.editor);
        gizmo.showEdges();
        await gizmo.execute(async distance => {
            chamfer.update();
        }, mode.Persistent).resource(this);

        const selection = await chamfer.commit() as visual.Solid;
        this.editor.selection.selected.addSolid(selection);
    }
}

export class CharacterCurveCommand extends Command {
    async execute(): Promise<void> {
        const character = new CharacterCurveFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        character.update(); // It has sensible defaults, so show something immediately

        const characterDialog = new CharacterCurveDialog(character, this.editor.signals);
        const dialog = characterDialog.execute(async params => {
            await character.update();
        }).resource(this);

        // Dialog OK/Cancel buttons trigger completion of the entire command.
        dialog.then(() => this.finish(), () => this.cancel());

        await this.finished;

        character.commit();
    }
}

export class OffsetFaceCommand extends Command {
    point?: THREE.Vector3

    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const parent = faces[0].parentItem as visual.Solid

        const offsetFace = new OffsetFaceFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        offsetFace.solid = parent;
        offsetFace.faces = faces;

        const gizmo = new OffsetFaceGizmo(offsetFace, this.editor, this.point);

        await gizmo.execute(async params => {
            await offsetFace.update();
        }).resource(this);

        await offsetFace.commit();
    }
}

export class DraftSolidCommand extends Command {
    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const parent = faces[0].parentItem as visual.Solid

        const face = faces[0];
        const faceModel = this.editor.db.lookupTopologyItem(face);
        const point = cart2vec(faceModel.Point(0.5, 0.5));

        const draftSolid = new DraftSolidFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        draftSolid.solid = parent;
        draftSolid.faces = faces;
        draftSolid.pivot = point;

        const gizmo = new RotateGizmo(draftSolid, this.editor);
        await gizmo.execute(params => {
            draftSolid.update();
        }, mode.Persistent).resource(this);

        await draftSolid.commit();
    }
}


export class RemoveFaceCommand extends Command {
    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const parent = faces[0].parentItem as visual.Solid

        const removeFace = new RemoveFaceFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        removeFace.solid = parent;
        removeFace.faces = faces;

        await removeFace.commit();
    }
}

export class PurifyFaceCommand extends Command {
    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const parent = faces[0].parentItem as visual.Solid

        const removeFace = new PurifyFaceFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        removeFace.solid = parent;
        removeFace.faces = faces;

        await removeFace.commit();
    }
}

export class CreateFaceCommand extends Command {
    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const parent = faces[0].parentItem as visual.Solid

        const removeFace = new CreateFaceFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        removeFace.solid = parent;
        removeFace.faces = faces;

        await removeFace.commit();
    }
}

export class ActionFaceCommand extends Command {
    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const parent = faces[0].parentItem as visual.Solid
        const face = faces[0];

        const actionFace = new ActionFaceFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        actionFace.solid = parent;
        actionFace.faces = faces;

        const faceModel = this.editor.db.lookupTopologyItem(face);
        const point_ = faceModel.Point(0.5, 0.5);
        const point = new THREE.Vector3(point_.x, point_.y, point_.z);
        const gizmo = new MoveGizmo(actionFace, this.editor);
        gizmo.position.copy(point);

        await gizmo.execute(async delta => {
            await actionFace.update();
        }).resource(this);

        await actionFace.commit();
    }
}

export class RefilletFaceCommand extends Command {
    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const parent = faces[0].parentItem as visual.Solid

        const refillet = new FilletFaceFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        refillet.solid = parent;
        refillet.faces = faces;

        const gizmo = new DistanceGizmo("refillet-face:distance", this.editor);
        const { point, normal } = OffsetFaceGizmo.placement(this.editor.db.lookupTopologyItem(faces[0]));
        gizmo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        gizmo.position.copy(point);

        gizmo.state.min = Number.NEGATIVE_INFINITY;

        await gizmo.execute(async distance => {
            refillet.distance = distance;
            await refillet.update();
        }).resource(this);

        await refillet.commit();
    }
}

export class SuppleFaceCommand extends Command { async execute(): Promise<void> { } }

export class MergerFaceCommand extends Command { async execute(): Promise<void> { } }

export class LoftCommand extends Command {
    async execute(): Promise<void> {
        const curves = [...this.editor.selection.selected.curves];
        const loft = new LoftFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        loft.curves = curves;
        await loft.update();
        const spine = loft.spine;

        // const curve = new CurveFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        // curve.type = c3d.SpaceType.Bezier3D;
        // for (const { point, Z } of spine) {
        //     curve.points.push(point);
        // }
        // await curve.update();

        const { point, Z } = spine[0];
        const gizmo = new MagnitudeGizmo("loft:thickness", this.editor);
        gizmo.position.copy(point);
        gizmo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), Z);
        await gizmo.execute(async thickness => {
            loft.thickness = thickness;
            loft.update();
        }, mode.Persistent).resource(this);

        // curve.cancel();
        await loft.commit();
    }
}

export class ExtrudeCommand extends Command {
    async execute(): Promise<void> {
        const curves = [...this.editor.selection.selected.curves];
        const extrude = new ExtrudeFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        extrude.curves = curves;

        const pointPicker = new PointPicker(this.editor);
        const { point: p1 } = await pointPicker.execute().resource(this);

        await pointPicker.execute(({ point: p2 }) => {
            extrude.direction = p2.clone().sub(p1);
            extrude.distance1 = extrude.direction.length();
            extrude.update();
        }).resource(this);

        await extrude.commit();
    }
}

export class ExtrudeRegionCommand extends Command {
    point?: THREE.Vector3

    async execute(): Promise<void> {
        const regions = [...this.editor.selection.selected.regions];
        const extrude = new RegionExtrudeFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        extrude.region = regions[0];

        const bbox = new THREE.Box3();
        bbox.expandByObject(extrude.region);
        const centroid = new THREE.Vector3();
        bbox.getCenter(centroid);

        const gizmo = new ExtrudeGizmo(extrude, this.editor);
        gizmo.position.copy(centroid);
        gizmo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), extrude.direction);

        await gizmo.execute(params => {
            extrude.distance1 = params.distance1;
            extrude.race1 = params.race1;
            extrude.update();
        }).resource(this);

        await extrude.commit();
        this.editor.selection.selected.removeRegion(regions[0]);
    }
}

export class MirrorCommand extends Command {
    async execute(): Promise<void> {
        const curves = [...this.editor.selection.selected.curves];
        const mirror = new MirrorFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        mirror.curve = curves[0];

        const pointPicker = new PointPicker(this.editor);
        const { point: p1, info: { constructionPlane } } = await pointPicker.execute().resource(this);
        pointPicker.restrictToPlaneThroughPoint(p1);

        mirror.origin = p1;

        await pointPicker.execute(({ point: p2 }) => {
            mirror.normal = p2.clone().sub(p1).cross(constructionPlane.n);
            mirror.update();
        }).resource(this);

        await mirror.commit();
    }
}

export class DeleteCommand extends Command {
    async execute(): Promise<void> {
        const items = [...this.editor.selection.selected.curves, ...this.editor.selection.selected.solids];
        const ps = items.map(i => this.editor.db.removeItem(i));
        await Promise.all(ps);
    }
}

export class ChangePointCommand extends Command {
    async execute(): Promise<void> {
        const controlPoint = this.editor.selection.selected.controlPoints.first;

        const changePoint = new ChangePointFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        changePoint.controlPoint = controlPoint;

        const gizmo = new MoveGizmo(changePoint, this.editor);
        gizmo.position.copy(changePoint.originalPosition);
        await gizmo.execute(delta => {
            changePoint.update();
        }).resource(this);

        const newInstance = await changePoint.commit() as visual.SpaceInstance<visual.Curve3D>;

        const newCurve = newInstance.underlying;
        const newPoint = newCurve.points.findByIndex(controlPoint.index)!;
        this.editor.selection.selected.addControlPoint(newPoint, newInstance);
    }
}

export class RemovePointCommand extends Command {
    async execute(): Promise<void> {
        const controlPoint = this.editor.selection.selected.controlPoints.first;
        const instance = controlPoint.parentItem;

        const removePoint = new RemovePointFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        removePoint.controlPoint = controlPoint;

        const newInstance = await removePoint.commit() as visual.SpaceInstance<visual.Curve3D>;
        this.editor.selection.selected.addCurve(newInstance);
    }
}

export class TrimCommand extends Command {
    async execute(): Promise<void> {
        this.editor.layers.showFragments();
        this.ensure(() => this.editor.layers.hideFragments());

        const picker = new ObjectPicker(this.editor);
        picker.allowCurveFragments();
        const selection = await picker.execute().resource(this);
        const fragment = selection.curves.first;
        if (fragment === undefined) return;

        const factory = new TrimFactory(this.editor.db, this.editor.materials, this.editor.signals);
        factory.fragment = fragment;
        await factory.commit();

        this.editor.enqueue(new TrimCommand(this.editor));
    }
}

export class FilletCurveCommand extends Command {
    async execute(): Promise<void> {
        const controlPoints = [...this.editor.selection.selected.controlPoints];
        const factory = new JointOrPolylineOrContourFilletFactory(this.editor.db, this.editor.materials, this.editor.signals);
        factory.curves = this.editor.curves; // FIXME need to DI this in constructor of all factories
        await factory.setControlPoints(controlPoints);
        const gizmo = new LengthGizmo("contour-fillet:radius", this.editor);

        const cornerAngle = factory.cornerAngle;
        gizmo.position.copy(cornerAngle.origin);
        const quat = new THREE.Quaternion();
        quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cornerAngle.tau.cross(cornerAngle.axis));
        gizmo.quaternion.copy(quat);

        await gizmo.execute(d => {
            factory.radius = d;
            factory.update();
        }, mode.Persistent).resource(this);

        await factory.commit();
    }
}

export class SelectFilletsCommand extends Command {
    async execute(): Promise<void> {
        const solid = this.editor.selection.selected.solids.first;
        const model = this.editor.db.lookup(solid);
        const shell = model.GetShell()!;
        const removableFaces = c3d.ActionDirect.CollectFacesForModification(shell, c3d.ModifyingType.Purify, 1);

        const ids = removableFaces.map(f => visual.Face.simpleName(solid.simpleName, model.GetFaceIndex(f)));
        for (const id of ids) {
            const { views } = this.editor.db.lookupTopologyItemById(id);
            const view = views.values().next().value;
            this.editor.selection.selected.addFace(view, solid);
        }
    }
}

export class ClipCurveCommand extends Command {
    async execute(): Promise<void> {
        const makeCurve = new CurveWithPreviewFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        const cut = new CutFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);

        const pointPicker = new PointPicker(this.editor);
        pointPicker.restrictToConstructionPlane = true;
        while (true) {
            try {
                const { point } = await pointPicker.execute(async ({ point }) => {
                    makeCurve.preview.last = point;
                    if (!makeCurve.preview.hasEnoughPoints) return;
                    await makeCurve.preview.update();
                }, 'RejectOnFinish').resource(this);

                makeCurve.push(point);
                makeCurve.update();
            } catch (e) {
                if (e !== Finish) throw e;
                break;
            }
        }

        cut.constructionPlane = this.editor.activeViewport?.constructionPlane;
        cut.solid = this.editor.selection.selected.solids.first;
        cut.curve = await makeCurve.commit() as visual.SpaceInstance<visual.Curve3D>;

        const result = await cut.commit() as visual.Solid[];
        this.editor.selection.selected.addSolid(result[0]);
    }
}

export class OffsetLoopCommand extends Command {
    async execute(): Promise<void> {
        const faces = [...this.editor.selection.selected.faces];
        const face = faces[0];
        const parent = faces[0].parentItem as visual.Solid
        const model = this.editor.db.lookupTopologyItem(face);
        let contour: c3d.ContourOnSurface | undefined;
        const surface = model.GetSurface().GetSurface();
        for (let i = 0, l = model.GetLoopsCount(); i < l; i++) {
            const loop = model.GetLoop(i)!;
            contour = loop.MakeContourOnSurface(surface, model.IsSameSense(), true);
            break;
        }
        if (contour === undefined) return;
        const center = contour.GetContour().GetWeightCentre();

        const offsetContour = new OffsetContourFactory(this.editor.db, this.editor.materials, this.editor.signals).resource(this);
        offsetContour.surface = contour.GetSurface();
        offsetContour.model = contour.GetContour();

        const gizmo = new DistanceGizmo("offset-loop:distance", this.editor);
        const point = model.Point(center.x, center.y);
        const normal = model.Normal(center.x, center.y);
        gizmo.position.copy(cart2vec(point));
        gizmo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec2vec(normal));

        await gizmo.execute(async distance => {
            offsetContour.distance = distance;
            offsetContour.update();
        }, mode.Persistent).resource(this);


        this.editor.selection.selected.removeFace(face, parent);

        const foo = await offsetContour.commit();
    }
}