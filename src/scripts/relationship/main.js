/**
 * Created by wb-llw259548 on 2017/2/6.
 */
const d3 = require('d3');

//节点类型静态变量
const
    _PERSON_TYPE = 'person',
    _RELATION_TYPE = 'relation';

const caches = {
    //节点数据
    nodes: [
        {name: 'James', type: _PERSON_TYPE},
        {name: 'Irvin', type: _PERSON_TYPE},
        {name: 'Love', type: _PERSON_TYPE},
        {name: '队友', type: _RELATION_TYPE},
        {name: '好友', type: _RELATION_TYPE},
        {name: '亲戚', type: _RELATION_TYPE}
    ],
    //连线数据
    edges: [//从人物指向关系
        {source: 0, target: 3},
        {source: 1, target: 3},
        {source: 2, target: 3},
        {source: 1, target: 4},
        {source: 1, target: 5}
    ],
    //svg宽高
    svgWidth: 500,
    svgHeight: 500,
    //svg
    svgEle: null,
    //力布局
    forceLayout: null,
    //连线
    lineElesD3: null,
    //节点
    circleElesD3: null,
    circleEleD3Data: null,
    //节点上的文字
    textElesD3: null,
    //颜色生成器
    colorGenerator: null,
    //当前选中的节点
    currentSelectCircleEles: [],
    //刷子模型
    brushModel: null,
    //刷子分组节点
    brushGroupEleD3: null,
    //刷子比例尺
    brushXScale: null,
    brushYScale: null
};

const relationshipMain = {
    /**初始化*/
    init() {
        this.initPage();
        this.initData();
        this.initEvent();
        this.initComponent();
    },
    /**初始化数据*/
    initData() {
        console.log('load data');
    },
    /**初始化页面*/
    initPage() {
        //svg和布局
        this.createSvgEle();
        this.createForceLayout(caches.nodes, caches.edges);
        //工具
        this.createColorGenerator();
        //关系图
        this.renderLines();
        this.renderCircles();
        this.renderText();
        //处理按钮
        this.addControlArea();
        this.addDeleteBtn();
        //处理刷子
        this.createBrushGroup();
        this.createBrushScale();
        this.buildBrushModel();
        this.renderBrush();
    },
    /**初始化事件*/
    initEvent() {
        //关系节点移动监听器
        this.tickEventListener();
        //点击选中事件
        this.clickSingleCircleEventListener();
        //删除按钮事件
        this.deleteRelationOrPersonEventListener();
        this.addBrushStartEvent();
        //刷子移动事件
        this.addBrushEvent();
        //刷子结束事件
        this.addBrushEnd();

        d3.behavior.drag()
            .on('dragstart', function (d) {
                d3.event.sourceEvent.stopPropagation();
            });

        // caches.svgEle.on('click', function() {
        //     console.log('svg click');
        // });
        let triggerBrushPrepare = false,
            beginTime = null;
        caches.svgEle.on('mousedown', function() {
            triggerBrushPrepare = true;
            beginTime = new Date().getTime();
        });
        caches.svgEle.on('mouseup', function() {
            // console.log(new Date().getTime() - beginTime < 200);
            if (triggerBrushPrepare && (new Date().getTime() - beginTime < 200)) {
                console.log('click click');
                // console.log(d3.event.target);
            }
        });
        caches.forceLayout.on('start', function() {
            console.log('force drag start');
        });
    },
    /**初始化组件*/
    initComponent() {
    },
    /**创建svg*/
    createSvgEle() {
        caches.svgEle = d3.select('body').insert('svg', 'script')
            .attr('width', caches.svgWidth)
            .attr('height', caches.svgHeight)
            .style({border: '1px solid black'});
    },
    /**创建力布局*/
    createForceLayout(nodes, edges) {
        //力布局
        caches.forceLayout = d3.layout.force()
            .nodes(nodes)
            .links(edges)
            .size([caches.svgWidth, caches.svgHeight])//作用范围
            .linkDistance(90)//连线距离
            .charge(-400);//节点电荷数
        //开启力布局
        caches.forceLayout.start();
    },
    /**创建颜色生成器*/
    createColorGenerator() {
        caches.colorGenerator = d3.scale.category20();
    },
    /**绘制连线*/
    renderLines() {
        caches.lineElesD3 = caches.svgEle.selectAll('.forceLine')
            .data(caches.edges)
            .enter()
            .append('line')
            .attr('data-sourceindex', d => d.source.index)
            .attr('data-targetindex', d => d.target.index)
            .classed('forceLine', true)
            .style('stroke', '#ccc')
            .style('stroke-width', 1);
    },
    /**绘制节点*/
    renderCircles() {
        caches.circleEleD3Data = caches.svgEle.selectAll('.forceCircle')
            .data(caches.nodes);

        caches.circleElesD3 = caches.circleEleD3Data
            .enter()
            .append('circle')
            .attr('data-index', d => d.index)
            .classed('forceCircle', true)
            .attr('r', 20)
            .style('fill', (d, i) => d.type == _PERSON_TYPE ? 'green' : 'yellow')
            .style({stroke: 'black', 'stroke-width': 2})
            .call(caches.forceLayout.drag);//允许拖动
    },
    /**绘制文字*/
    renderText() {
        caches.textElesD3 = caches.svgEle.selectAll('.forceText')
            .data(caches.nodes)
            .enter()
            .append('text')
            .attr('data-index', d => d.index)
            .classed('forceText', true)
            .attr('dx', '-1em')
            .attr('dy', '.4em')
            .text(d => d.name);
    },
    /**tick监听器:当节点运动的时候调用*/
    tickEventListener() {
        caches.forceLayout.on('tick', () => {
            //更新连线坐标
            caches.lineElesD3
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            //更新节点坐标
            caches.circleElesD3
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            //更新节点上文字的坐标
            caches.textElesD3
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
    },
    /**点击单个节点事件监听*/
    clickSingleCircleEventListener() {
        caches.circleElesD3.on('click', function(d, i) {
            console.log('circle click');
            //选中节点
            caches.circleElesD3.style('fill', (d, i) => d.type == _PERSON_TYPE ? 'green' : 'yellow');
            d3.select(this).style('fill', 'blue');
            caches.currentSelectCircleEles = [];
            caches.currentSelectCircleEles.push(this);
        });
    },
    /**添加操作区*/
    addControlArea() {
        caches.controlAreaEle = d3.select('body').insert('div', 'script')
            .classed('control-area', true);
    },
    /**添加删除按钮*/
    addDeleteBtn() {
        caches.deleteBtnEle = caches.controlAreaEle.append('button').text('delete');
    },
    /**
     * 删除节点事件监听
     * 依赖：deleteBtnEle、 currentSelectCircleEles、nodes、edges、lineElesD3
     * */
    deleteRelationOrPersonEventListener() {
        caches.deleteBtnEle.on('click', function() {
            //获取选中节点
            let index = d3.select(caches.currentSelectCircleEles[0]).attr('data-index');

            //判断是否能够删除(只能删除最外围的节点)
            let linesAmount = 0,
                canRemove = true,
                lineEles = caches.lineElesD3[0];
            for (let i = 0; i < lineEles.length; ++i) {
                if (d3.select(lineEles[i]).attr('data-sourceindex') == index || d3.select(lineEles[i]).attr('data-targetindex') == index) {
                    ++linesAmount;
                }
                if (lineEles.length > 2 && linesAmount > 1) {
                    canRemove = false;
                    break;
                }
            }
            if (!canRemove) return ;

            //删除节点缓存
            caches.nodes.forEach((ele, i) => ele.index == index ? caches.nodes.splice(i, 1) : ele);
            //删除视图上的节点
            d3.select(caches.currentSelectCircleEles[0]).remove();
            //删除视图节点缓存
            caches.circleElesD3[0].map((ele, i) => {
                if (d3.select(ele).attr('data-index') == index) {
                    caches.circleElesD3[0].splice(i , 1);
                }
            });

            //删除节点连线缓存数据
            caches.edges.map((ele, i) => ele.source.index == index || ele.target.index == index ? caches.edges.splice(i, 1) : null);
            //删除视图上的节点连线
            let newLinesElesD3Arr = [];
            caches.lineElesD3[0].map((ele, i) => {
                if (d3.select(ele).attr('data-sourceindex') == index || d3.select(ele).attr('data-targetindex') == index) {
                    caches.lineElesD3[0][i].remove();//在视图中删除，因没有存入新缓存，故在视图缓存节点中也删除
                } else {
                    newLinesElesD3Arr.push(ele);
                }
            });
            caches.lineElesD3[0] = newLinesElesD3Arr;

            //删除视图上的文字
            caches.textElesD3[0].map((ele, i) => {
                if (index == d3.select(ele).attr('data-index')) {
                    caches.textElesD3[0][i].remove();
                }
            });
        });
    },
    /**创建刷子分组节点*/
    createBrushGroup() {
        caches.brushGroupEleD3 = caches.svgEle.append('g').classed('brush', true);
    },
    /**创建刷子比例尺*/
    createBrushScale() {
        //x轴比例尺
        caches.brushXScale = d3.scale.linear()
            .domain([0, caches.svgWidth])
            .range([0, caches.svgWidth]);
        //y轴比例尺
        caches.brushYScale = d3.scale.linear()
            .domain([0, caches.svgHeight])
            .range([0, caches.svgHeight]);
    },
    /**构建刷子模型*/
    buildBrushModel() {
        caches.brushModel = d3.svg.brush()
            .x(caches.brushXScale)
            .y(caches.brushYScale)
            .extent([[0, 0], [0, 0]]);
    },
    /**渲染刷子*/
    renderBrush() {
        caches.brushGroupEleD3.call(caches.brushModel)
            .selectAll('rect')
            .style({'fill-opacity': .3});
    },
    /**添加刷子出现时事件*/
    addBrushStartEvent() {
        caches.brushModel.on('brushstart', function() {
            console.log('brush start');
        });
    },
    /**添加刷子移动事件*/
    addBrushEvent() {
        caches.brushModel.on('brush', function() {
            let extent = caches.brushModel.extent(),
                xMin = extent[0][0],
                xMax = extent[1][0],
                yMin = extent[0][1],
                yMax = extent[1][1];
            //选中变红
            caches.circleElesD3.style('stroke',
                d =>
                    d.x >= xMin && d.x <= xMax && d.y >= yMin && d.y <= yMax ?
                        'red' : 'black');
        });
    },
    /**添加刷子结束事件*/
    addBrushEnd() {
        caches.brushModel.on('brushend', function() {
            console.log('brush end');
            relationshipMain.buildBrushModel();
            relationshipMain.renderBrush();
            relationshipMain.addBrushEvent();
            relationshipMain.addBrushEnd();
        });
    }
};

export default relationshipMain;