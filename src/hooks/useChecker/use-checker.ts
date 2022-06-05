import { ref, computed } from '@vue/composition-api'
import type { Ref } from '@vue/composition-api'

enum CHECKER_TYPE {
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

type Config = {
  value?: string
  disabled?: string
}

type CheckerConfig = {
  type?: CHECKER_TYPE
  min?: number
  max?: number
  config?: Config
}

type ValuesAsKeys<T extends Record<any, PropertyKey>, NewValue> = Record<T[keyof T], NewValue>
type IOption = ValuesAsKeys<Config, string | number | boolean>

type ReturnTypes = {
  checkedRef: Ref<Array<string | number> | string | number>
  optionsRef: Ref<IOption[]>
  isActive: (value: string | number) => boolean
  check: (option: IOption) => void
  allActiveRef: Ref<Boolean>
  checkAll: () => void
}

/**
 * @param type 选择器类型
 * @param min 最少选择个数
 * @param max 最大选择个数
 * @param config 字段映射配置，默认需要value和disabled字段
 * @returns {*[]}
 */
export function useChecker({
  type = CHECKER_TYPE.CHECKBOX,
  min = 0,
  max = undefined,
  config = { value: 'value', disabled: 'disabled' }
}: CheckerConfig = {}): ReturnTypes {
  const { value = 'value', disabled = 'disabled' } = config
  // 选中项
  const checkedRef = ref<number | string | Array<string | number> | undefined | null>(null)
  // 选项 ref(Array<{value: any, disabled?: boolean}>)
  const optionsRef = ref([])

  if (type === CHECKER_TYPE.CHECKBOX) {
    checkedRef.value = []
  } else {
    checkedRef.value = ''
  }

  // 可用选项
  const enabledOptionsRef = computed(() => optionsRef.value.filter((option) => option[disabled] !== true))

  // 最大选项默认值
  const maxDefaultRef = computed(() => {
    return max || enabledOptionsRef.value.length
  })

  /**
   * 判断选项是否选中
   * @param value 选项value值
   * @returns {boolean} true:选中
   */
  const isActive = (value: string | number) => {
    return type === CHECKER_TYPE.RADIO
      ? checkedRef.value === value
      : (checkedRef.value as Array<string | number>).includes(value)
  }

  // 选择全部操作
  const checkAll = () => {
    if ((checkedRef.value as Array<string | number>).length === enabledOptionsRef.value.length) {
      checkedRef.value = []
    } else {
      checkedRef.value = enabledOptionsRef.value.map((item) => item[value])
    }
  }

  // 全选按钮状态（是否选中）
  const allActiveRef = computed(
    () => (checkedRef.value as Array<string | number>).length === enabledOptionsRef.value.length
  )

  /**
   * 点击选项选择操作
   * @param option 选项{value: any, disabled?: boolean}
   */
  function check(option: IOption) {
    if (option[disabled] === false) {
      return
    }

    if (type === CHECKER_TYPE.RADIO) {
      checkRadio(option[value] as string | number)
    } else {
      checkCheckbox(option[value] as string | number)
    }
  }

  function checkRadio(value: string | number) {
    checkedRef.value = value
  }

  function checkCheckbox(value: string | number) {
    const valueLen = (checkedRef.value as Array<string | number>).length
    const max = maxDefaultRef.value

    const index = (checkedRef.value as Array<string | number>).indexOf(value)

    if (index > -1) {
      // 取消选项
      valueLen > min && (checkedRef.value as Array<string | number>).splice(index, 1)
      return
    }
    if (max === 1) {
      // 激活选项，最大选择数为1时，往往需要特殊处理，直接替换原来的
      ;(checkedRef.value as Array<string | number>).splice(0, 1, value)
      return
    }
    // 其他激活选项的情况
    valueLen < max && (checkedRef.value as Array<string | number>).push(value)
  }

  return {
    checkedRef: checkedRef as Ref<number | string | Array<string | number>>,
    optionsRef,
    isActive,
    check,
    allActiveRef,
    checkAll
  }
}
