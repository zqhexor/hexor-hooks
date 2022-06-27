import { ref, reactive, readonly } from 'vue'

/**
 * 分页参数常量
 * @type {{PAGE_NUM: string, PAGE_SIZE: string}}
 */
export const Pagination = readonly({
  PAGE_NUM: 'pageNum', // 页码
  PAGE_SIZE: 'pageSize' // 每页条数
})

/**
 * 返回参数常量
 * @type {{TOTAL: string, DATA: string}}
 */
export const ReturnArgs = readonly({
  TOTAL: 'total', // 总数
  DATA: 'data', // 数据列表
  REST: 'rest' // 额外数据 todo
})

/**
 *  下拉刷新的hooks
 * @param getDataListApi [Function] 此函数包含一个查询条件入参，返回的Promise对象成功的话必须包含{total: Number, data: Array}
 * @param isLoaded [Boolean] 下拉刷新组件数据是否全部加载完毕,用于控制组件初始化加载 false:会初始化加载，true:不会
 * @param pageSize 每页条数，默认10条
 * @return {{onRefresh: onRefresh, refreshing: (boolean|Ref<UnwrapRef<boolean>>|Ref<any | undefined>), dataList: (Array|Ref<UnwrapRef<Array>>|Ref<any | undefined>), onLoad: onLoad, finished: (boolean|Ref<UnwrapRef<boolean>>|Ref<any | undefined>), loading: (boolean|Ref<UnwrapRef<boolean>>|Ref<any | undefined>), pageArg: UnwrapNestedRefs<{[p: string]: number}>, searchParams: ({}|Ref<UnwrapRef<{}>>|Ref<any | undefined>)}}
 */
export function useRefreshList(getDataListApi, isLoaded = false, pageSize = 10) {
  // 产品列表
  const dataList = ref([])

  // 查询条件
  const searchParams = ref({})

  // 分页参数
  const pageArg = reactive({
    [Pagination.PAGE_NUM]: 1,
    [Pagination.PAGE_SIZE]: pageSize
  })

  // 下拉刷新组件是否正在加载
  const loading = ref(false)
  // 下拉刷新组件数据是否全部加载完毕
  const finished = ref(isLoaded)
  // 下拉刷新组件是否处于正在刷新
  const refreshing = ref(false)

  /**
   * loadMore动作
   */
  const onLoad = () => {
    getDataList()
  }

  /**
   * refresh动作
   */
  const onRefresh = () => {
    finished.value = false
    // 清空列表数据
    dataList.value = []
    pageArg[Pagination.PAGE_NUM] = 1
    // 重新加载数据
    getDataList()
  }

  /**
   * 分页获取数据列表
   */
  function getDataList() {
    if (typeof getDataListApi !== 'function') {
      refreshing.value = false
      finished.value = true
      throw new Error('请求接口格式不正确')
    }
    const params = { ...searchParams.value, ...pageArg }
    loading.value = true
    const pageNum = pageArg[Pagination.PAGE_NUM]
    const pageSize = pageArg[Pagination.PAGE_SIZE]
    getDataListApi(params).then((res) => {
      refreshing.value = false
      // 总页数
      const totalPage = Math.ceil(parseFloat(res[ReturnArgs.TOTAL]) / pageSize)
      if (pageNum <= totalPage) {
        const result = res[ReturnArgs.DATA]
        dataList.value = dataList.value.concat(result)
        if (pageNum === totalPage) {
          // 没有新数据
          finished.value = true
        }
        pageArg[Pagination.PAGE_NUM]++
      } else {
        // 没有新数据
        finished.value = true
      }
    }, () => {
      refreshing.value = false
      if (pageNum === 1) {
        finished.value = true
      }
    }).finally(() => {
      loading.value = false
    })
  }

  return {
    dataList,
    searchParams,
    pageArg,
    loading,
    finished,
    refreshing,
    onLoad,
    onRefresh
  }
}
