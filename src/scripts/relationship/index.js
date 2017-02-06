/**
 * Created by wb-llw259548 on 2017/2/6.
 */
import relationshopMain from './main';

//页面js对象
const relationship = {
    /**初始化*/
    init() {
        this.initPage();
        this.initEvent();
        this.initComponent();
    },
    /**初始化页面*/
    initPage() {
    },
    /**初始化事件*/
    initEvent() {
    },
    /**初始化组件*/
    initComponent() {
        relationshopMain.init();
    }
};

//初始化
relationship.init();