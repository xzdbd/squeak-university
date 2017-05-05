package routers

import (
	"github.com/astaxie/beego"
	"github.com/xzdbd/squeak-university/controllers"
)

func init() {
	beego.Router("/", &controllers.MainController{})
}
