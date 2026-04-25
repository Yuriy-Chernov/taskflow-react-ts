import { Box, Pagination, PaginationItem, Typography } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { PAGE_SIZE } from "@/common/constants"
import { containerSx } from "@/common/styles"

type Props = {
  totalCount: number
  page: number
  setPage: (page: number) => void
}
export const TaskPagination = ({ totalCount, page, setPage }: Props) => {
  const changePage = (_: React.ChangeEvent<unknown>, page: number) => {
    setPage(page)
  }
  return  (<>
    <Pagination
      count={Math.ceil(totalCount / PAGE_SIZE)}
      page={page}
      shape="rounded"
      color="primary"
      renderItem={(item) => <PaginationItem slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }} {...item} />}
      onChange={changePage}
    />
    <Box sx={containerSx}>
      <Typography variant="caption" >Total:{totalCount}</Typography>
    </Box>
  </>)
}
