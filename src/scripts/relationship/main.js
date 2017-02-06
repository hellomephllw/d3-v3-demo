/**
 * Created by wb-llw259548 on 2017/2/6.
 */
const d3 = require('d3');

const caches = {
    //节点类型静态变量
    _PERSON_TYPE: 'person',
    _RELATION_TYPE: 'relation',
    //节点数据
    nodes: [
        {name: 'James', type: 'person'},
        {name: 'Irvin', type: 'person'},
        {name: 'Love', type: 'person'},
        {name: '队友', type: 'relation'},
        {name: '好友', type: 'relation'},
        {name: '亲戚', type: 'relation'}
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
    lineEles: null,
    //节点
    circleEles: null,
    circleEleData: null,
    //节点上的文字
    textEles: null,
    //颜色生成器
    colorGenerator: null,
    //当前选中的节点
    currentSelectCircles: []
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
        this.createSvgEle();
        this.createForceLayout(caches.nodes, caches.edges);
        this.createColorGenerator();
        this.renderLines();
        this.renderCircles();
        this.renderText();
        this.addControlArea();
        this.addDeleteBtn();
    },
    /**初始化事件*/
    initEvent() {
        this.tickEventListener();
        this.clickSingleCircleEventListener();
        this.deleteRelationOrPersonEventListener();
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
        caches.lineEles = caches.svgEle.selectAll('.forceLine')
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
        caches.circleEleData = caches.svgEle.selectAll('.forceCircle')
            .data(caches.nodes);

        caches.circleEles = caches.circleEleData
            .enter()
            .append('circle')
            .attr('data-sourceindex', d => d.index)
            .classed('forceCircle', true)
            .attr('r', 20)
            .style('fill', (d, i) => d.type == caches._PERSON_TYPE ? 'green' : 'yellow')
            .call(caches.forceLayout.drag);//允许拖动
    },
    /**绘制文字*/
    renderText() {
        caches.textEles = caches.svgEle.selectAll('.forceText')
            .data(caches.nodes)
            .enter()
            .append('text')
            .classed('forceText', true)
            .attr('dx', '-1em')
            .attr('dy', '.4em')
            .text(d => d.name);
    },
    /**tick监听器:当节点运动的时候调用*/
    tickEventListener() {
        caches.forceLayout.on('tick', () => {
            //更新连线坐标
            caches.lineEles
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            //更新节点坐标
            caches.circleEles
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            //更新节点上文字的坐标
            caches.textEles
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
    },
    /**点击单个节点事件监听*/
    clickSingleCircleEventListener() {
        caches.circleEles.on('click', function(d, i) {
            //选中节点
            d3.select(this).style('fill', 'blue');
            caches.currentSelectCircles = [];
            caches.currentSelectCircles.push(this);
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
     * 依赖：deleteBtnEle、 currentSelectCircles、edges、lineEles
     * */
    deleteRelationOrPersonEventListener() {
        caches.deleteBtnEle.on('click', function() {
            //获取选中节点
            let index = d3.select(caches.currentSelectCircles[0]).attr('data-sourceindex');
            //删除节点
            caches.nodes.forEach((ele, i) => ele.index == index ? caches.nodes.splice(i, 1) : ele);
            relationshipMain.createForceLayout(caches.nodes, caches.edges);
            d3.select(caches.currentSelectCircles[0]).remove();
            //删除节点连线
            caches.edges.map((ele, i) => ele.source.index == index || ele.target.index == index ? caches.edges.splice(i, 1) : null);
            caches.lineEles[0].map((ele, i) => {
                //
                if (d3.select(ele).attr('data-sourceindex') == index || d3.select(ele).attr('data-targetindex') == index) {
                    caches.lineEles[0][i].remove();
                }
            });
        });
    }
};

export default relationshipMain;