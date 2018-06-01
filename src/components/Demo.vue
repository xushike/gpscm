<template>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="date" label="日期" width="180">
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="180">
      </el-table-column>
      <el-table-column prop="address" label="地址">
      </el-table-column>
    </el-table>
</template>
<script>
export default {
  data() {
    return {
      tableData: []
    };
  },

  created() {
    this.$api.post(
      "/news/index",
      {},
      res => {
        this.tableData = res.data;
        console.log("success:",res.data)
      },
      err => {
        console.log("failure:",err);
      }
    );
  },

  start() {}
};
</script>

<style scoped>

</style>

