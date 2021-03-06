/**
 * Created by wb-llw259548 on 2017/2/6.
 */
const d3 = require('d3');

//节点类型静态变量
const
    _PERSON_TYPE = 'person',
    _MERGE_PERSON_TYPE = 'mergePerson',
    _RELATION_TYPE = 'relation',
    _MERGE_RELATION_TYPE = 'mergeRelation';

const caches = {
    //节点数据
    nodes: [
        {id: 67, name: 'James', type: _PERSON_TYPE},
        {id: 55, name: 'Irvin', type: _PERSON_TYPE},
        {id: 38, name: 'Love', type: _PERSON_TYPE},
        {id: 44, name: '队友', type: _RELATION_TYPE},
        {id: 11, name: '好友', type: _RELATION_TYPE},
        {id: 97, name: '亲戚', type: _RELATION_TYPE}
    ],
    //连线数据
    links: [//从人物指向关系
        {source: 0, target: 3},
        {source: 1, target: 3},
        {source: 2, target: 3},
        {source: 1, target: 4},
        {source: 1, target: 5}
    ],
    //svg
    svgData: {
        width: 500,//svg宽
        height: 500,//svg高
        eleD3: null//svg节点
    },
    //力布局
    forceLayout: null,
    //连线缓存
    linkLine: {
        groupEleD3: null,//连线group
        groupClassName: 'line-group',//连线的group class
        elesD3: null,//连线节点
        lineClassName: 'forceLine',//连线class
        lineElesD3CacheDataPropName: '_linkLineCacheData'//连线缓存属性名
    },
    //节点缓存
    circle: {
        groupEleD3: null,
        groupClassName: 'circle-group',
        elesD3: null,
        circleClassName: 'forceCircle',
        circleElesD3CacheDataPropName: '_circleCacheData'
    },
    //文字缓存
    text: {
        groupEleD3: null,
        groupClassName: 'text-group',
        elesD3: null,
        textClassName: 'forceText'
    },
    //刷子
    brush: {
        groupEleD3: null,//刷子group
        xScale: null,//x轴比例尺
        yScale: null,//y轴比例尺
        model: null,//刷子模型
        eleD3: null//刷子节点
    },
    //当前被选中的节点
    currentSelectCircleElesD3: [],
    //合并节点
    mergeCircle: {
        groupEleD3: null,
        groupClassName: 'circle-group',
        elesD3: [],
        circleClassName: 'mergeForceCircle',
        circleElesD3CacheDataPropName: '_mergeCircleCacheData',
        mergeCirclesCacheDataPropName: '_circleCacheData',
        mergeLinesCacheDataPropName: '_linkLineCacheData'
    },
    //按钮
    btn: {
        controlAreaD3: null,
        controlAreaClassName: 'control-area',
        controlAreaId: 'controlArea',
        mergeBtnEleD3: null
    }
};

const relationshipMain = {
    /**初始化*/
    init() {
        this.initData();
        this.initPage();
        this.initEvent();
        this.initComponent();
    },
    /**初始化数据*/
    initData() {
        console.log('load data');
    },
    /**初始化页面*/
    initPage() {
        //创建svg
        this.createSvgEle();
        //创建力布局
        this.createForceLayout();
        //创建刷子
        this.createBrushGroup();
        this.createBrushScale();
        this.buildBrushModel();
        this.renderBrush();
        //绘制关系图
        this.drawLines();
        this.drawCircles();
        this.drawText();
        //创建按钮
        this.createControlArea();
        this.createMergeBtn();
    },
    /**初始化事件*/
    initEvent() {
        //tick事件监听器
        this.tickEvent();
        //注册刷子的事件监听器
        this.addBrushStartEvent();
        this.addBrushMoveEvent();
        this.addBrushEndEvent();
        //合并节点事件监听器
        this.mergeCircleEvent();
    },
    /**初始化组件*/
    initComponent() {
    },
    /**创建svg*/
    createSvgEle() {
        //声明变量
        let svgEleD3,
            svgWidth = caches.svgData.width,
            svgHeight = caches.svgData.height;

        //生成svg
        svgEleD3 = d3.select('body').insert('svg', 'script')
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .style({
                position: 'relative',
                border: '1px solid black'
            });

        //缓存变量
        caches.svgData.eleD3 = svgEleD3;
    },
    /**创建力布局*/
    createForceLayout() {
        //声明变量
        let forceLayout,
            nodes = caches.nodes,
            links = caches.links,
            svgWidth = caches.svgData.width,
            svgHeight = caches.svgData.height;

        //力布局
        forceLayout = d3.layout.force()
            .nodes(nodes)
            .links(links)
            .size([svgWidth, svgHeight])//作用范围
            .linkDistance(90)//连线距离
            .charge(-200);//节点电荷数
        //开启力布局
        forceLayout.start();

        //缓存变量
        caches.forceLayout = forceLayout;
    },
    /**绘制连线*/
    drawLines() {
        //声明变量
        let groupClassName = caches.linkLine.groupClassName,
            lineClassName = caches.linkLine.lineClassName,
            propName = caches.linkLine.lineElesD3CacheDataPropName,
            svgEleD3 = caches.svgData.eleD3,
            links = caches.links,
            lineElesD3,
            lineElesGroup;

        //绑定数据与绘制
        lineElesGroup = svgEleD3.append('g')
            .classed(groupClassName, true);

        lineElesD3 = lineElesGroup
            .selectAll(`.${lineClassName}`)
            .data(links)
            .enter()
            .append('line')
            .classed(lineClassName, true)
            .style('stroke', '#ccc')
            .style('stroke-width', 1)
            .property(propName, d => d);

        //缓存变量
        caches.linkLine.elesD3 = lineElesD3;
        caches.linkLine.groupEle = lineElesGroup;
    },
    /**绘制节点*/
    drawCircles() {
        //声明变量
        let svgEleD3 = caches.svgData.eleD3,
            circleElesGroupD3,
            circleElesD3,
            circleClassName = caches.circle.circleClassName,
            groupClassName = caches.circle.groupClassName,
            nodes = caches.nodes,
            forceLayout = caches.forceLayout;

        //绑定数据与绘制
        circleElesGroupD3 = svgEleD3.append('g')
            .classed(groupClassName, true);

        circleElesD3 = circleElesGroupD3.selectAll(`.${circleClassName}`)
            .data(nodes)
            .enter()
            .append('circle')
            .classed(circleClassName, true)
            .attr('r', 20)
            .style('fill', (d, i) => d.type == _PERSON_TYPE ? 'green' : 'yellow')
            .style({stroke: 'black', 'stroke-width': 2})
            .property(caches.circle.circleElesD3CacheDataPropName, d => d)
            .call(forceLayout.drag);//允许拖动

        //缓存变量
        caches.circle.groupEleD3 = circleElesGroupD3;
        caches.circle.elesD3 = circleElesD3;
    },
    /**绘制文字*/
    drawText() {
        //变量声明
        let svgEle = caches.svgData.eleD3,
            nodes = caches.nodes,
            groupEleD3 = null,
            groupClassName = caches.text.groupClassName,
            textElesD3 = null,
            textClassName = caches.text.textClassName;

        //绑定数据与绘制
        groupEleD3 = svgEle.append('g')
            .classed(groupClassName, true);

        textElesD3 = groupEleD3.selectAll(`.${textClassName}`)
            .data(nodes)
            .enter()
            .append('text')
            .attr('data-index', d => d.index)
            .classed(textClassName, true)
            .attr('dx', '-1em')
            .attr('dy', '.4em')
            .text(d => d.name);

        //缓存变量
        caches.text.groupEleD3 = groupEleD3;
        caches.text.elesD3 = textElesD3;
    },
    /**tick监听器:当节点运动的时候调用*/
    tickEvent() {
        caches.forceLayout.on('tick', () => {
            //更新连线坐标
            caches.linkLine.elesD3
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            //更新节点坐标
            caches.circle.elesD3
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            //更新节点上文字的坐标
            caches.text.elesD3
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
    },
    /**创建刷子group*/
    createBrushGroup() {
        //声明变量
        let svgEle = caches.svgData.eleD3,
            brushGroupEleD3;

        //渲染
        brushGroupEleD3 = svgEle.append('g')
            .classed('brush', true);

        //缓存变量
        caches.brush.groupEleD3 = brushGroupEleD3;
    },
    /**创建刷子比例尺*/
    createBrushScale() {
        //初始化变量
        let xScale,
            yScale,
            svgWidth = caches.svgData.width,
            svgHeight = caches.svgData.height;

        //x轴比例尺
        xScale = d3.scale.linear()
            .domain([0, svgWidth])
            .range([0, svgWidth]);
        //y轴比例尺
        yScale = d3.scale.linear()
            .domain([0, svgHeight])
            .range([0, svgHeight]);

        //缓存变量
        caches.brush.xScale = xScale;
        caches.brush.yScale = yScale;
    },
    /**构建刷子模型*/
    buildBrushModel() {
        //初始化变量
        let xScale = caches.brush.xScale,
            yScale = caches.brush.yScale,
            brushModel;

        //刷子模型
        brushModel = d3.svg.brush()
            .x(xScale)
            .y(yScale)
            .extent([[0, 0], [0, 0]]);

        //缓存变量
        caches.brush.model = brushModel;
    },
    /**渲染刷子*/
    renderBrush() {
        //声明变量
        let brushModel = caches.brush.model,
            brushGroupEleD3 = caches.brush.groupEleD3;

        //渲染刷子
        brushGroupEleD3.call(brushModel)
            .selectAll('rect')
            .style({'fill-opacity': .3});
    },
    /**刷子开始框选时事件*/
    addBrushStartEvent() {
        //声明变量
        let brushModel = caches.brush.model;

        //注册事件监听器
        brushModel.on('brushstart', function() {

        });
    },
    /**刷子移动时的事件*/
    addBrushMoveEvent() {
        //声明变量
        let brushModel = caches.brush.model;

        //注册事件监听器
        brushModel.on('brush', function() {
            let extent = brushModel.extent(),
                xMin = extent[0][0],
                xMax = extent[1][0],
                yMin = extent[0][1],
                yMax = extent[1][1],
                circleElesD3 = caches.circle.elesD3,
                circleCacheDataPropName = caches.circle.circleElesD3CacheDataPropName;

            /*选中变红*/
            circleElesD3.style('stroke',
                d =>
                    d.x >= xMin && d.x <= xMax && d.y >= yMin && d.y <= yMax ?
                        'red' : 'black');
            /*框选节点*/
            //清空选中节点的缓存
            caches.currentSelectCircleElesD3 = [];
            //选中后记录选中节点
            circleElesD3.each(function(d, i) {
                //节点在框选范围内
                if (d.x >= xMin && d.x <= xMax && d.y >= yMin && d.y <= yMax) {
                    //节点不能重复选中
                    let currentSelectedEleD3 = d3.select(this),
                        currentSelectCircleElesD3 = caches.currentSelectCircleElesD3,
                        exist = false;
                    for (let i = 0, len = currentSelectCircleElesD3.length; i < len; ++i) {
                        if (currentSelectCircleElesD3[i][0][0][circleCacheDataPropName].id == currentSelectedEleD3[0][0][circleCacheDataPropName].id) {
                            exist = true;
                            break;
                        }
                    }
                    //缓存被选中节点
                    if (!exist) currentSelectCircleElesD3.push(currentSelectedEleD3);
                }
            });
        });
    },
    /**刷子框选结束时的事件*/
    addBrushEndEvent() {
        //声明变量
        let brushModel = caches.brush.model;

        //注册事件监听器
        brushModel.on('brushend', function() {
            relationshipMain.buildBrushModel();
            relationshipMain.renderBrush();
            relationshipMain.addBrushMoveEvent();
            relationshipMain.addBrushEndEvent();
        });
    },
    /**创建操作区域*/
    createControlArea() {
        let controlAreaD3 = d3.select(document.body)
            .insert('div', 'script')
            .classed(caches.btn.controlAreaClassName, true);

        caches.btn.controlAreaD3 = controlAreaD3;
    },
    /**创建合并按钮*/
    createMergeBtn() {
        let mergeBtnEleD3,
            controlAreaD3 = caches.btn.controlAreaD3;

        mergeBtnEleD3 = controlAreaD3.append('button')
            .text('merge');

        caches.btn.mergeBtnEleD3 = mergeBtnEleD3;
    },
    /**合并节点*/
    mergeCircleEvent() {
        let mergeCircleBtn = caches.btn.mergeBtnEleD3,
            circleElesD3CacheDataPropName = caches.circle.circleElesD3CacheDataPropName,
            lineElesD3CacheDataPropName = caches.linkLine.lineElesD3CacheDataPropName;

        mergeCircleBtn.on('click', () => {
            let currentSelectedCircleElesD3 = caches.currentSelectCircleElesD3,
                lengthOfCurrentSelectedCircleElesD3 = currentSelectedCircleElesD3.length;

            /**
             * 判断是否满足合并条件
             */
            //1.至少两个节点
            if (lengthOfCurrentSelectedCircleElesD3 < 2) return ;

            //2.只能合并最外围的点(只能有一条线在身上)
            let existLinkLineElesD3 = caches.linkLine.elesD3,
                lengthOfExistLinkLineElesD3 = existLinkLineElesD3[0].length,
                linkLineOnCircleElesD3 = [];
            for (let i = 0; i < lengthOfCurrentSelectedCircleElesD3; ++i) {//所有选中节点
                let circleEleD3 = currentSelectedCircleElesD3[i],
                    linkLinesAmount = 0;
                for (let j = 0; j < lengthOfExistLinkLineElesD3; ++j) {//所有连线
                    let lineEleD3 = d3.select(existLinkLineElesD3[0][j]);
                    if (circleEleD3[0][0][circleElesD3CacheDataPropName].id == lineEleD3[0][0][lineElesD3CacheDataPropName].source.id ||
                        circleEleD3[0][0][circleElesD3CacheDataPropName].id == lineEleD3[0][0][lineElesD3CacheDataPropName].target.id) {
                        ++linkLinesAmount;
                        linkLineOnCircleElesD3.push(lineEleD3);
                    }
                    if (linkLinesAmount > 1) return ;
                }
            }

            //3.所合并的所有节点必须同属于某一个节点
            let lengthOfLinkLineOnCircleElesD3 = linkLineOnCircleElesD3.length;
            for (let i = 0; i < lengthOfLinkLineOnCircleElesD3 - 1; ++i) {
                for (let j = i + 1; j < lengthOfLinkLineOnCircleElesD3; ++j) {
                    if (!(linkLineOnCircleElesD3[i][0][0][lineElesD3CacheDataPropName].source.id == linkLineOnCircleElesD3[j][0][0][lineElesD3CacheDataPropName].source.id ||
                        linkLineOnCircleElesD3[i][0][0][lineElesD3CacheDataPropName].target.id == linkLineOnCircleElesD3[j][0][0][lineElesD3CacheDataPropName].target.id))
                        return ;
                }
            }
            console.log('success');

            /**
             * 合并步骤
             */
            //1.算出新节点的中心坐标
            //重排序

            //2.生成新节点

            //3.生成新节点的关系连线

            //4.把需要隐藏的节点和连线存入新生成的大节点缓存

            //5.删除旧节点

            //6.删除旧节点的连线

            //7.删除旧节点的文字

        });
    }
};

export default relationshipMain;