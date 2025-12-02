# 블록 데이터 (block-data) 추가 모달창에서 header/body 정보를 입력하는 방법
-- 상단의 메뉴에서 '토큰(Token)','입력필드(InputField)','텍스트(Text)','표(Table)','목록(List)','수식(Formula)' 중 하나를 골라 추가하는 방식 (삭제도 가능)
--- 위 항목을 추가하면 마우스 커서 위치에 JSON 텍스트가 추가된다. 
--- 항목별 추가되는 JSON 텍스트 형식은 다음과 같다. 

## 토큰(Token) 
{
    "name":"Token",
    "menu_key" : ""
}

## 입력필드(InputField)
{
    "name":"InputField"
}

## 텍스트(Text)
{
    "name":"Text"
    "content":""
}

## 표(Table)
{
    "name":"Table"
    "init_row": 0,
    "init_col": 0
}

## 수식(Formula)
{
    "name":"Formula"
}

## 목록(List)
{
    "name":"List"
    "item_type": "",
    "menu_key" : "",
    "optional" : false
}