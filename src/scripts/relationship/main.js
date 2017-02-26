/**
 * Created by wb-llw259548 on 2017/2/6.
 */
const d3 = require('d3');

//节点类型静态变量
const
    _PERSON_TYPE = 'person',
    _BIG_PERSON_TYPE = 'bigPerson',
    _RELATION_TYPE = 'relation',
    _BIG_RELATION_TYPE = 'bigRelation';

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
        width: 500,
        height: 500,
        eleD3: null
    },
    //力布局
    forceLayout: null,
    //连线缓存
    linkLine: {
        groupEleD3: null,
        groupClassName: 'line-group',
        elesD3: null,
        lineClassName: 'forceLine',
        lineElesD3CacheDataPropName: '_linkLineCacheData'
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
        //绘制关系图
        this.drawLines();
        this.drawCircles();
        this.drawText();
    },
    /**初始化事件*/
    initEvent() {
        this.tickEvent();
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
    }
};

export default relationshipMain;