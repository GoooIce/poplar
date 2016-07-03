/**
 * Created by grzhan on 16/7/1.
 */
/// <reference path="../../svgjs/svgjs.d.ts" />

import {TextSelector} from './TextSelector';

export class Draw {
    private board;
    private  margin = 25;
    private  lineHeight = 40;
    private needExtend = false;
    constructor(board) {
        this.board = board;
    }

    public highlight(width, height, left, top, color='#e8fbe8') {
        return this.board.group['highlight'].rect(width, height).move(left, top).attr({fill: color});
    }
    
    public textline(lineNo, content, left, top) {
        return this.board.group['text'].text(content).attr({'id': `text-line-${lineNo}`}).move(left, top);
    }

    public annotation(content='avg_Problem') {
        this.needExtend = false;
        let margin = this.margin;
        let selector = TextSelector.rect();
        let lineNo = TextSelector.lineNo();
        let textDef = this.board.svg.defs().text(content).size(12);
        let width = textDef.node.clientWidth;
        let height = textDef.node.clientHeight;
        let left = selector.left + selector.width / 2 - width / 2;
        let top = this.calcAnnotationTop(textDef);
        let text = this.board.svg.use(textDef).move(left, top);
        let rect = this.board.svg.rect(width + 4, height + 4).move(left - 2 , top + 2).fill('lightgreen').stroke('#148414').radius(2);
        let annotateGroup = this.board.svg.group();
        let bHeight = margin - 6;
        let bTop = top + rect.height() + 2;
        let bracket = this.bracket(selector.left, bTop, selector.left + selector.width, bTop, bHeight);
        annotateGroup.add(rect);
        annotateGroup.add(text);
        annotateGroup.add(bracket);
        window['b'] = bracket;
        this.board.lines['annotation'][lineNo - 1].push(annotateGroup);
        if (this.needExtend) {
            this.extendAnnotationLine(lineNo);
        }
    }

    // Thanks for Alex Hornbake's function (generate curly bracket path)
    // http://bl.ocks.org/alexhornbake/6005176
    public bracket(x1,y1,x2,y2,width,q=0.6) {
        //Calculate unit vector
        let dx = x1-x2;
        let dy = y1-y2;
        let len = Math.sqrt(dx*dx + dy*dy);
        dx = dx / len;
        dy = dy / len;

        //Calculate Control Points of path,
        let qx1 = x1 + q*width*dy;
        let qy1 = y1 - q*width*dx;
        let qx2 = (x1 - .25*len*dx) + (1-q)*width*dy;
        let qy2 = (y1 - .25*len*dy) - (1-q)*width*dx;
        let tx1 = (x1 -  .5*len*dx) + width*dy;
        let ty1 = (y1 -  .5*len*dy) - width*dx;
        let qx3 = x2 + q*width*dy;
        let qy3 = y2 - q*width*dx;
        let qx4 = (x1 - .75*len*dx) + (1-q)*width*dy;
        let qy4 = (y1 - .75*len*dy) - (1-q)*width*dx;
        return this.board.svg.path(`M${x1},${y1}Q${qx1},${qy1},${qx2},${qy2}T${tx1},${ty1}M${x2},${y2}Q${qx3},${qy3},${qx4},${qy4}T${tx1},${ty1}`)
            .fill('none').stroke({ color: '#148414', width: 0.5}).transform({rotation: 180});
    }

    public label(content) {
        let lineNo = TextSelector.lineNo();
        if (this.board.lines.annotation[lineNo - 1].length < 1) {
            this.extendAnnotationLine(lineNo);
        }
        let {width, height, left, top} = TextSelector.rect();
        // let dy = this.board.lines['text'][lineNo -1].transform()['y'];
        let highlight = this.highlight(width, height, left, top);
        this.board.lines['highlight'][lineNo - 1].push(highlight);
        this.annotation(content);
    }
    
    private extendAnnotationLine(lineNo) {
        let s = lineNo - 1;                     // Array lines.* index
        let textlines = this.board.lines['text'];
        let highlights = this.board.lines['highlight'];
        let annotations = this.board.lines['annotation'];
        let lineHeight = this.lineHeight;
        for (let i = s; i < textlines.length; i++) {
            textlines[i].dy(lineHeight);
            if (highlights[i]) {
                for (let highlight of highlights[i]) {
                    highlight.dy(lineHeight);
                }
            }
            if (annotations[i]) {
                for (let annotation of annotations[i]) {
                    let {y} = annotation.transform();
                    annotation.transform({y: y+lineHeight});
                }
            }
        }
    }

    private calcAnnotationTop(text) {
        let selector = TextSelector.rect();
        let lineNo = TextSelector.lineNo();
        let width = text.node.clientWidth;
        let height = text.node.clientHeight;
        let left = selector.left + selector.width / 2 - width / 2;
        let top = selector.top - this.margin - height;
        while (this.isCollisionInLine(lineNo, width + 4, height + 4, left - 2, top + 2)) {
            top -= this.lineHeight;
        }
        return top;
    }

    private isCollisionInLine(lineNo, width, height, left, top) {
        let annotations = this.board.lines['annotation'][lineNo - 1];
        if (annotations.length < 1) {
            return false;
        }
        let flag = false;
        let minY = 100000000;
        for (let annotaion of annotations) {
            let elements = annotaion.children();
            for (let element of elements) {
               let y = element.y() +  annotaion.transform()['y'];
               if (element.type == 'rect') {
                   if (minY > y) {
                       minY = y;
                   }
                   if (this.isCollision(left, top, width, height, element.x(), y, element.width(), element.height())) {
                       return true;
                   }
               }
            }
        }
        if (top < minY) {
            this.needExtend = true;
        }
        return false;
    }

    private isCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        if (x1 >= x2 && x1 >= x2 + w2) {
            return false;
        } else if (x1 <= x2 && x1 + w1 <= x2) {
            return false;
        } else if (y1 >= y2 && y1 >= y2 + h2) {
            return false;
        } else if (y1 <= y2 && y1 + h1 <= y2) {
            return false;
        }
        return true;
    }
}